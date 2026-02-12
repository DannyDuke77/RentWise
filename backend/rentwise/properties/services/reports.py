import io
from decimal import Decimal
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from ..models import Tenancy, UnitPayment

def get_property_audit_data(property_obj, start_date, end_date):
    """
    Financial Position Ledger:
    - Payments: Increase cash (+)
    - Refunds: Decrease cash (-) and show in Money Out
    """
    # 1. Opening Cash Balance (Net collections before start_date)
    total_bal_bf = Decimal("0.00")
    
    historical_tx = UnitPayment.objects.filter(
        tenancy__unit__property=property_obj,
        paid_on__date__lt=start_date
    )
    
    for tx in historical_tx:
        if tx.type == 'refund':
            total_bal_bf -= tx.amount_paid
        else:
            total_bal_bf += tx.amount_paid

    # 2. Period Transactions
    raw_transactions = UnitPayment.objects.filter(
        tenancy__unit__property=property_obj,
        paid_on__date__range=[start_date, end_date]
    ).order_by('paid_on')

    ledger_entries = []
    running_cash_balance = total_bal_bf

    for p in raw_transactions:
        # Check type explicitly
        is_refund = (p.type == 'refund')
        
        # Display Logic
        money_in = p.amount_paid if not is_refund else Decimal("0.00")
        money_out = p.amount_paid if is_refund else Decimal("0.00")
        
        # MATH FIX: 
        # Balance = Previous + Payment (In) - Refund (Out)
        running_cash_balance = running_cash_balance + money_in - money_out

        ledger_entries.append({
            'date': p.paid_on.strftime('%Y-%m-%d'),
            'unit': p.tenancy.unit.name if p.tenancy else "N/A",
            'tenant': p.tenancy.tenants.first().full_name if p.tenancy and p.tenancy.tenants.exists() else "N/A",
            'type': p.get_type_display(),
            'in': money_in,
            'out': money_out, # Passed correctly to PDF generator
            'balance': running_cash_balance
        })

    return {
        'property_name': property_obj.name,
        'bal_bf': total_bal_bf,
        'ledger': ledger_entries
    }

def generate_property_audit_pdf(property_obj, audit_data, start_date, end_date):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"Financial Position: {property_obj.name}", styles['Title']))
    elements.append(Paragraph(f"Period: {start_date} to {end_date}", styles['Normal']))
    elements.append(Paragraph(f"Opening Cash Balance (BF): KES {audit_data['bal_bf']:,.2f}", styles['Heading3']))
    elements.append(Spacer(1, 12))

    # Table Header
    data = [['Date', 'Unit', 'Tenant', 'Type', 'Money In (KES)', 'Money Out (KES)', 'Cash Balance (KES) ']]
    
    for t in audit_data['ledger']:
        data.append([
            t['date'],
            t['unit'],
            t['tenant'][:15],
            t['type'],
            f"{t['in']:,.2f}" if t['in'] > 0 else "-",
            f"{t['out']:,.2f}" if t['out'] > 0 else "-",
            f"{t['balance']:,.2f}"
        ])

    table = Table(data, colWidths=[65, 45, 110, 55, 80, 80, 85])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (4, 1), (-1, -1), 'RIGHT'), 
        ('ALIGN', (5, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (6, 1), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer