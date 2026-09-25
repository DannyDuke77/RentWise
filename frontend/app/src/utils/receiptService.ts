import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReceiptBusiness {
  company_name: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  currency: string;
}

const loadImageAsDataURL = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/* ---------- helpers ---------- */

const formatMoney = (amount: number | string, currency: string) =>
  `${currency} ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Resolve the canonical transaction identifier for the receipt.
 * Prefers the M-Pesa receipt number when present (it's what the customer
 * has on their phone), then falls back through the other identifiers.
 */
const resolveReference = (payment: any): string =>
  payment?.mpesa_receipt_number ||
  payment?.reference ||
  payment?.transaction_code ||
  payment?.checkout_request_id ||
  payment?.merchant_request_id ||
  "N/A";

/* ---------- main ---------- */

export const generateReceiptPDF = async (
  payment: any,
  property: any,
  unit: any,
  business: ReceiptBusiness
): Promise<boolean> => {
  if (!business) {
    console.error("[receipt] No business profile provided");
    return false;
  }
  if (!payment) {
    console.error("[receipt] No payment provided");
    return false;
  }

  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;

    const currency = business.currency || "KES";
    const isPayment = payment.type === "payment";

    const unitName = unit?.name || payment.unit_name || "Unit";
    const propertyName = property?.name || payment.property_name || "Property";
    const reference = resolveReference(payment);
    const dateStr = formatDate(payment.paid_on);
    const timeStr = formatTime(payment.paid_on);
    const method = (payment.payment_method || "—").toUpperCase();

    /* ---------- palette ---------- */
    const ink = [15, 23, 42] as [number, number, number];        // slate-900
    const inkAlt = [30, 41, 59] as [number, number, number];     // slate-800
    const muted = [100, 116, 139] as [number, number, number];   // slate-500
    const soft = [148, 163, 184] as [number, number, number];    // slate-400
    const rule = [226, 232, 240] as [number, number, number];    // slate-200
    const surface = [248, 250, 252] as [number, number, number]; // slate-50
    const bandText = [241, 245, 249] as [number, number, number];// slate-100
    const bandMuted = [203, 213, 225] as [number, number, number];// slate-300

    // Status colours stay semantic — green/red — so PAID vs REFUNDED
    // is unambiguous even from across a desk.
    const statusColor: [number, number, number] = isPayment
      ? [22, 101, 52]   // green-800
      : [153, 27, 27];  // red-800
    const statusBg: [number, number, number] = isPayment
      ? [240, 253, 244] // green-50
      : [254, 242, 242]; // red-50

    /* ---------- header band ---------- */
    doc.setFillColor(...ink);
    doc.rect(0, 0, pageW, 34, "F");

    // Logo (white chip on the band)
    const logoUrl = business.logo || "/rentwise_logo.jpeg";
    const logoData = await loadImageAsDataURL(logoUrl);
    if (logoData) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, 7, 20, 20, 2, 2, "F");
        doc.addImage(logoData, "JPEG", margin + 2, 9, 16, 16);
      } catch (err) {
        console.warn("[receipt] Logo embed failed, continuing without it", err);
      }
    }

    // Business name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      (business.company_name || "PAYMENT RECEIPT").toUpperCase(),
      margin + 26,
      15
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...bandMuted);

    const contactBits = [business.address, business.phone]
      .filter(Boolean)
      .join("  ·  ");
    if (contactBits) doc.text(contactBits, margin + 26, 21);
    if (business.email) doc.text(business.email, margin + 26, 26);

    // "RECEIPT" label + transaction code on the right of the band
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RECEIPT", pageW - margin, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...bandMuted);
    doc.text(`Txn: ${reference}`, pageW - margin, 19, { align: "right" });
    doc.text(dateStr, pageW - margin, 24, { align: "right" });

    /* ---------- status pill + amount ---------- */
    let y = 48;

    const statusText = isPayment ? "PAID" : "REFUNDED";

    doc.setFillColor(...statusBg);
    doc.roundedRect(margin, y, 34, 9, 4.5, 4.5, "F");
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, 34, 9, 4.5, 4.5, "S");

    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(statusText, margin + 17, y + 6, { align: "center" });

    // Amount on the right
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Amount", pageW - margin, y + 2, { align: "right" });

    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(
      formatMoney(payment.amount_paid, currency),
      pageW - margin,
      y + 9,
      { align: "right" }
    );

    /* ---------- summary grid ---------- */
    y += 20;

    const drawInfoBlock = (
      x: number,
      width: number,
      rows: Array<{ label: string; value: string }>
    ) => {
      doc.setFillColor(...surface);
      doc.roundedRect(x, y, width, rows.length * 10 + 8, 2, 2, "F");

      rows.forEach((row, i) => {
        const rowY = y + 7 + i * 10;

        doc.setTextColor(...muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(row.label.toUpperCase(), x + 5, rowY);

        doc.setTextColor(...ink);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(row.value, x + 5, rowY + 4.5);
      });
    };

    const halfGap = 4;
    const halfW = (contentW - halfGap) / 2;

    drawInfoBlock(margin, halfW, [
      { label: "Received from", value: payment.tenant_name || "Tenant" },
      { label: "Payment method", value: method + ` (${payment.source})` },
    ]);

    drawInfoBlock(margin + halfW + halfGap, halfW, [
      { label: "Unit", value: unitName },
      { label: "Property", value: propertyName },
    ]);

    y += 20 + 8 + 6;

    /* ---------- line items table ---------- */
    autoTable(doc, {
      startY: y,
      head: [["Description", "Method", "Amount"]],
      body: [
        [
          `${isPayment ? 
              payment.category.charAt(0).toUpperCase() + payment.category.slice(1).toLowerCase() + " Payment"
              : "Refund"} - ${unitName}`,
          method,
          formatMoney(payment.amount_paid, currency),
        ],
      ],
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: { top: 4, bottom: 4, left: 0, right: 0 },
        textColor: ink,
        lineColor: rule,
        lineWidth: { bottom: 0.1 },
      },
      headStyles: {
        fontSize: 8,
        fontStyle: "bold",
        textColor: muted,
        cellPadding: { top: 0, bottom: 3, left: 0, right: 0 },
        lineWidth: { bottom: 0.3 },
        lineColor: rule,
      },
      columnStyles: {
        0: { cellWidth: contentW - 70 },
        1: { cellWidth: 30, halign: "left" },
        2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 6;

    /* ---------- totals block ---------- */
    const totalsW = 80;
    const totalsX = pageW - margin - totalsW;

    doc.setDrawColor(...rule);
    doc.setLineWidth(0.2);
    doc.line(totalsX, y, pageW - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("Subtotal", totalsX, y);
    doc.setTextColor(...ink);
    doc.text(formatMoney(payment.amount_paid, currency), pageW - margin, y, {
      align: "right",
    });
    y += 6;

    doc.setTextColor(...muted);
    doc.text("Total", totalsX, y);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(payment.amount_paid, currency), pageW - margin, y, {
      align: "right",
    });

    // Heavy rule under total — slate-900 to match the theme
    y += 3;
    doc.setDrawColor(...ink);
    doc.setLineWidth(0.5);
    doc.line(totalsX, y, pageW - margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...inkAlt);
    doc.text(isPayment ? "Total received" : "Total refunded", totalsX, y);
    doc.text(formatMoney(payment.amount_paid, currency), pageW - margin, y, {
      align: "right",
    });

    /* ---------- meta strip ---------- */
    y += 14;

    doc.setDrawColor(...rule);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`${method.toLowerCase() === "cash" ? `Transaction ID: ${payment.id}` : `Transaction code: ${reference}`}`, margin, y);
    doc.text(`Issued: ${dateStr} at ${timeStr}`, pageW - margin, y, {
      align: "right",
    });

    /* ---------- footer ---------- */
    const footerY = pageH - 24;

    doc.setDrawColor(...rule);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 6, pageW - margin, footerY - 6);

    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const thankYou = business.company_name
      ? `Thank you for choosing ${business.company_name}. For any queries, please contact management.`
      : "Thank you for your payment. For any queries, please contact management.";
    doc.text(thankYou, pageW / 2, footerY, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(...soft);
    doc.text(
      "Generated by RentWise Property Management System",
      pageW / 2,
      footerY + 8.5,
      { align: "center" }
    );

    const safeRef = reference.replace(/[^A-Za-z0-9_-]/g, "");
    const hasRealRef = safeRef && safeRef !== "NA";
    const fallback = String(payment.id ?? "Payment").slice(0, 8);

    doc.save(`Receipt_${hasRealRef ? safeRef : fallback}.pdf`);
    return true;
  } catch (error) {
    console.error("[receipt] Failed to generate receipt:", error);
    return false;
  }
};