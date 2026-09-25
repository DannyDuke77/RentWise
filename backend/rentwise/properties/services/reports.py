import io
import base64
import urllib.request
from datetime import datetime
from decimal import Decimal
from urllib.parse import urlparse

from django.conf import settings

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable,
)

from ..models import UnitPayment


# ============================================================
# Data
# ============================================================

def _resolve_reference(payment):
    """
    Build a prefixed reference string.

    STK (source='stk'):
        'stk_<receipt>_<phone>'   (falls back to checkout id, then 'STK')

    Manual (source='manual'):
        'mpesa_<reference>'  or  'bank_<reference>'
        'cash'               (cash has no external reference)
        Falls back to 'manual_<reference>' for unknown methods.
    """
    if payment.source == "stk":
        txn = payment.mpesa_transaction
        if txn:
            code = (
                txn.mpesa_receipt_number
                or (txn.checkout_request_id[:16] if txn.checkout_request_id else "STK")
            )
            phone = txn.phone_number or ""
            return f"stk_{code}_{phone}" if phone else f"stk_{code}"
        return "stk_STK"

    method = (payment.payment_method or "").strip().lower()
    manual_ref = (payment.reference or "").strip()

    if method == "cash":
        return "cash"

    if method in {"mpesa", "bank"}:
        return f"{method}_{manual_ref}" if manual_ref else f"{method}_--"

    # Unknown method — keep the ref if present so nothing is lost
    return f"manual_{manual_ref}" if manual_ref else "manual"


def get_property_audit_data(property_obj, start_date, end_date):
    """
    Financial Position Ledger:
    - Payments: Increase cash (+)
    - Refunds:  Decrease cash (-) and show in Money Out
    """
    total_bal_bf = Decimal("0.00")

    historical_tx = UnitPayment.objects.filter(
        tenancy__unit__property=property_obj,
        paid_on__date__lt=start_date,
    )

    for tx in historical_tx:
        if tx.type == 'refund':
            total_bal_bf -= tx.amount_paid
        else:
            total_bal_bf += tx.amount_paid

    raw_transactions = (
        UnitPayment.objects
        .filter(
            tenancy__unit__property=property_obj,
            paid_on__date__range=[start_date, end_date],
        )
        .select_related("tenancy", "tenancy__unit", "mpesa_transaction")
        .order_by('paid_on')
    )

    ledger_entries = []
    running_cash_balance = total_bal_bf

    for p in raw_transactions:
        is_refund = (p.type == 'refund')

        money_in = p.amount_paid if not is_refund else Decimal("0.00")
        money_out = p.amount_paid if is_refund else Decimal("0.00")

        running_cash_balance = running_cash_balance + money_in - money_out

        ledger_entries.append({
            'date': p.paid_on.strftime('%Y-%m-%d'),
            'unit': p.tenancy.unit.name if p.tenancy else "N/A",
            'reference': _resolve_reference(p),
            'category': "Deposit" if p.get_category_display() == "Security Deposit" else p.get_category_display(),
            'in': money_in,
            'out': money_out,
            'balance': running_cash_balance,
        })

    return {
        'property_name': property_obj.name,
        'bal_bf': total_bal_bf,
        'ledger': ledger_entries,
    }


# ============================================================
# Palette
# ============================================================

INK       = colors.HexColor("#111827")
MUTED     = colors.HexColor("#6B7280")
HAIRLINE  = colors.HexColor("#E5E7EB")
SOFT      = colors.HexColor("#F9FAFB")
POSITIVE  = colors.HexColor("#047857")
NEGATIVE  = colors.HexColor("#B91C1C")
HEADER_BG = colors.HexColor("#111827")
HEADER_FG = colors.HexColor("#F9FAFB")


# ============================================================
# Helpers
# ============================================================

def _money(v):
    try:
        return f"{Decimal(v):,.2f}"
    except Exception:
        return "-"


def _fmt_date(d):
    if isinstance(d, str):
        try:
            d = datetime.fromisoformat(d).date()
        except Exception:
            return d
    return d.strftime("%d %b %Y") if hasattr(d, "strftime") else str(d)


def _logo_flowable(business, width=18 * mm, height=18 * mm):
    """
    Return a reportlab Image flowable from business.logo_url(), or None.
    Handles HTTP(S), data URIs, /media/ paths (via MEDIA_ROOT), and local files.
    Never raises.
    """
    try:
        url = business.logo_url() if hasattr(business, "logo_url") else None
    except Exception:
        return None

    if not url:
        return None

    candidates = []

    if url.startswith(("http://", "https://")):
        candidates.append(("http", url))
        try:
            media_url = settings.MEDIA_URL or "/media/"
            path = urlparse(url).path
            if path.startswith(media_url):
                rel = path[len(media_url):]
                disk = str(settings.MEDIA_ROOT / rel)
                candidates.append(("file", disk))
        except Exception:
            pass
    elif url.startswith("data:"):
        candidates.append(("data", url))
    else:
        candidates.append(("file", url))

    for kind, src in candidates:
        try:
            if kind == "http":
                req = urllib.request.Request(src, headers={"User-Agent": "reportlab/audit-pdf"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    raw = resp.read()
                return Image(io.BytesIO(raw), width=width, height=height, kind="proportional")

            if kind == "data":
                _, b64 = src.split(",", 1)
                raw = base64.b64decode(b64)
                return Image(io.BytesIO(raw), width=width, height=height, kind="proportional")

            return Image(src, width=width, height=height, kind="proportional")

        except Exception:
            continue

    return None


# ============================================================
# Styles
# ============================================================

def _styles():
    ss = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=ss["Title"], fontName="Helvetica-Bold",
            fontSize=18, leading=22, textColor=INK, alignment=TA_LEFT, spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=ss["Normal"], fontName="Helvetica",
            fontSize=9.5, leading=13, textColor=MUTED, alignment=TA_LEFT,
        ),
        "company": ParagraphStyle(
            "company", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=11, leading=14, textColor=INK, alignment=TA_LEFT, spaceAfter=1,
        ),
        "meta": ParagraphStyle(
            "meta", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8.5, leading=11.5, textColor=MUTED, alignment=TA_LEFT,
        ),
        "metaR": ParagraphStyle(
            "metaR", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8.5, leading=11.5, textColor=MUTED, alignment=TA_RIGHT,
        ),
        "section": ParagraphStyle(
            "section", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=10, leading=13, textColor=INK, spaceBefore=6, spaceAfter=6,
        ),
        "th": ParagraphStyle(
            "th", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=8, leading=10, textColor=HEADER_FG, alignment=TA_LEFT,
        ),
        "thR": ParagraphStyle(
            "thR", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=8, leading=10, textColor=HEADER_FG, alignment=TA_RIGHT,
        ),
        "td": ParagraphStyle(
            "td", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8, leading=10.5, textColor=INK, alignment=TA_LEFT,
        ),
        "tdR": ParagraphStyle(
            "tdR", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8, leading=10.5, textColor=INK, alignment=TA_RIGHT,
        ),
        "tdMuted": ParagraphStyle(
            "tdMuted", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8, leading=10.5, textColor=MUTED, alignment=TA_LEFT,
        ),
        "summaryLabel": ParagraphStyle(
            "summaryLabel", parent=ss["Normal"], fontName="Helvetica",
            fontSize=9, leading=12, textColor=MUTED, alignment=TA_LEFT,
        ),
        "summaryValue": ParagraphStyle(
            "summaryValue", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=11, leading=14, textColor=INK, alignment=TA_RIGHT,
        ),
        "footer": ParagraphStyle(
            "footer", parent=ss["Normal"], fontName="Helvetica",
            fontSize=7.5, leading=10, textColor=MUTED, alignment=TA_LEFT,
        ),
        "sigLabel": ParagraphStyle(
            "sigLabel", parent=ss["Normal"], fontName="Helvetica",
            fontSize=8, leading=11, textColor=MUTED, alignment=TA_LEFT,
        ),
        "sigLine": ParagraphStyle(
            "sigLine", parent=ss["Normal"], fontName="Helvetica-Bold",
            fontSize=9, leading=12, textColor=INK, alignment=TA_LEFT,
        ),
    }


# ============================================================
# Page furniture
# ============================================================

def _draw_page(canvas, doc, property_obj, start_date, end_date):
    canvas.saveState()
    w, h = A4

    canvas.setStrokeColor(HAIRLINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, h - 12 * mm, w - 20 * mm, h - 12 * mm)
    canvas.line(20 * mm, 16 * mm, w - 20 * mm, 16 * mm)

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)

    company = getattr(property_obj.business, "company_name", "") or ""
    canvas.drawString(
        20 * mm, 12 * mm,
        f"{company}  ·  Statement of Financial Position  ·  "
        f"{_fmt_date(start_date)} – {_fmt_date(end_date)}",
    )
    canvas.drawRightString(w - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas.drawString(
        20 * mm, 8 * mm,
        f"Generated {datetime.now().strftime('%d %b %Y %H:%M')} by Rentwise.",
    )

    canvas.restoreState()


# ============================================================
# Blocks
# ============================================================

def _build_letterhead(property_obj, start_date, end_date, s):
    business = property_obj.business

    left = [Paragraph(business.company_name or "—", s["company"])]
    for val in [
        getattr(business, "address", None),
        getattr(business, "phone", None),
        getattr(business, "email", None),
    ]:
        if val:
            left.append(Paragraph(str(val), s["meta"]))

    right = [
        Paragraph("STATEMENT", ParagraphStyle(
            "lbl", parent=s["meta"], alignment=TA_RIGHT,
            fontName="Helvetica-Bold", textColor=MUTED, fontSize=7.5,
        )),
        Paragraph(property_obj.name, ParagraphStyle(
            "pname", parent=s["meta"], alignment=TA_RIGHT,
            fontName="Helvetica-Bold", textColor=INK, fontSize=11, leading=14,
        )),
        Paragraph(f"{_fmt_date(start_date)} – {_fmt_date(end_date)}", s["metaR"]),
        Paragraph(getattr(property_obj, "location", "") or "", s["metaR"]),
    ]

    logo_cell = _logo_flowable(business, width=18 * mm, height=18 * mm) or ""

    header = Table(
        [[logo_cell, left, right]],
        colWidths=[22 * mm, 90 * mm, 66 * mm],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header


def _build_summary_panel(audit_data, ledger, s):
    opening = Decimal(str(audit_data.get("bal_bf", 0) or 0))
    credits = sum((Decimal(str(t.get("in", 0) or 0)) for t in ledger), Decimal("0.00"))
    debits = sum((Decimal(str(t.get("out", 0) or 0)) for t in ledger), Decimal("0.00"))
    closing = opening + credits - debits

    def pair(label, value, color=INK):
        return (
            Paragraph(label, s["summaryLabel"]),
            Paragraph(f"KES {_money(value)}", ParagraphStyle(
                "sv", parent=s["summaryValue"], textColor=color,
            )),
        )

    cells = [
        pair("OPENING BALANCE (B/F)", opening),
        pair("TOTAL CREDITS", credits, POSITIVE),
        pair("TOTAL DEBITS", debits, NEGATIVE),
        pair("CLOSING BALANCE", closing),
    ]
    labels = [c[0] for c in cells]
    values = [c[1] for c in cells]

    t = Table([labels, values], colWidths=[44.5 * mm] * 4)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT),
        ("BOX", (0, 0), (-1, -1), 0.5, HAIRLINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, HAIRLINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
    ]))
    return t


def _build_ledger_table(ledger, s):
    header = [
        Paragraph("DATE", s["th"]),
        Paragraph("UNIT", s["th"]),
        Paragraph("REFERENCE", s["th"]),
        Paragraph("CATEGORY", s["th"]),
        Paragraph("CREDIT (KES)", s["thR"]),
        Paragraph("DEBIT (KES)", s["thR"]),
        Paragraph("BALANCE (KES)", s["thR"]),
    ]
    rows = [header]
    for t in ledger:
        credit = t.get("in", 0) or 0
        debit = t.get("out", 0) or 0
        rows.append([
            Paragraph(_fmt_date(t.get("date", "")), s["td"]),
            Paragraph(str(t.get("unit", "") or ""), s["td"]),
            Paragraph(str(t.get("reference", "") or "—"), s["td"]),
            Paragraph(str(t.get("category", "") or ""), s["tdMuted"]),
            Paragraph(_money(credit) if credit else "—", s["tdR"]),
            Paragraph(_money(debit) if debit else "—", s["tdR"]),
            Paragraph(_money(t.get("balance", 0)), s["tdR"]),
        ])

    t = Table(
        rows,
        colWidths=[20 * mm, 16 * mm, 62 * mm, 24 * mm, 23 * mm, 23 * mm, 24 * mm],
        repeatRows=1,
    )

    style = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), HEADER_FG),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 1), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, HAIRLINE),
        ("BOX", (0, 0), (-1, -1), 0.5, HAIRLINE),
    ]

    for i in range(1, len(rows)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), SOFT))

    t.setStyle(TableStyle(style))
    return t


def _build_footer_block(property_obj, s):
    left = [
        Paragraph("Prepared by", s["sigLabel"]),
        Spacer(1, 18),
        Paragraph("____________________________", s["sigLine"]),
        Paragraph("Authorised signatory", s["sigLabel"]),
    ]
    right = [
        Paragraph("Received by", s["sigLabel"]),
        Spacer(1, 18),
        Paragraph("____________________________", s["sigLine"]),
        Paragraph("Tenant / Representative", s["sigLabel"]),
    ]
    t = Table([[left, right]], colWidths=[89 * mm, 89 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


# ============================================================
# Entry point
# ============================================================

def generate_property_audit_pdf(property_obj, audit_data, start_date, end_date):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm, leftMargin=20 * mm,
        topMargin=22 * mm, bottomMargin=22 * mm,
        title=f"Statement — {property_obj.name}",
        author=getattr(property_obj.business, "company_name", "") or "Property Statement",
        subject="Statement of Financial Position",
    )

    s = _styles()
    elements = []

    elements.append(_build_letterhead(property_obj, start_date, end_date, s))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=0.75, color=INK, spaceAfter=10))

    elements.append(Paragraph("Statement of Financial Position", s["title"]))
    elements.append(Paragraph(
        f"{property_obj.name}  ·  {_fmt_date(start_date)} to {_fmt_date(end_date)}",
        s["subtitle"],
    ))
    elements.append(Spacer(1, 14))

    ledger = audit_data.get("ledger", []) or []
    elements.append(_build_summary_panel(audit_data, ledger, s))
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Transaction Ledger", s["section"]))
    if ledger:
        elements.append(_build_ledger_table(ledger, s))
    else:
        elements.append(Paragraph("No transactions recorded in this period.", s["meta"]))
    elements.append(Spacer(1, 18))

    elements.append(HRFlowable(width="100%", thickness=0.5, color=HAIRLINE, spaceAfter=8))
    elements.append(Paragraph(
        "<b>Reference key:</b> "
        "<b>stk_</b> M-Pesa STK push (receipt · phone)  ·  "
        "<b>mpesa_</b> M-Pesa recorded manually  ·  "
        "<b>bank_</b> bank transfer  ·  "
        "<b>cash</b> cash payment.",
        s["footer"],
    ))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "This statement is generated from the property management system and reflects all recorded "
        "transactions/payments within the stated period. Opening balance includes any "
        "amounts carried forward from prior periods. Balances are stated in Kenya Shillings (KES).",
        s["footer"],
    ))
    elements.append(Spacer(1, 22))

    elements.append(_build_footer_block(property_obj, s))

    doc.build(
        elements,
        onFirstPage=lambda c, d: _draw_page(c, d, property_obj, start_date, end_date),
        onLaterPages=lambda c, d: _draw_page(c, d, property_obj, start_date, end_date),
    )
    buffer.seek(0)
    return buffer