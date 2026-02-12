import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (payment: any, unit: any, profile: any) => {
    const doc = new jsPDF();
    const date = new Date(payment.paid_on).toLocaleDateString('en-GB');

    // 1. DYNAMIC LOGO
    // If profile.logo exists, it uses that, otherwise falls back to your local file
    const logoUrl = profile?.logo || '/rentwise_logo.jpeg';
    
    try {
        doc.addImage(logoUrl, 'JPEG', 15, 10, 25, 25);
    } catch (e) {
        console.error("Logo failed to load, skipping...", e);
    }

    // 2. DYNAMIC HEADER TEXT
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate-800
    // Use company_name from profile, default to a generic title if null
    doc.text((profile?.company_name || "PAYMENT RECEIPT").toUpperCase(), 45, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    
    // Combine Address and Phone if they exist
    const contactLine = [profile?.address, profile?.phone].filter(Boolean).join(" | ");
    if (contactLine) {
        doc.text(contactLine, 45, 28);
    }
    
    if (profile?.email) {
        doc.text(profile.email, 45, 33);
    } else {
        doc.text("Official Payment Receipt", 45, 33);
    }

    // 3. METADATA INFO BOX
    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(15, 45, 180, 25, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`RECEIPT NO:`, 22, 53);
    doc.setTextColor(0);
    doc.text(`${payment.reference || 'N/A'}`, 45, 53);
    
    doc.setTextColor(71, 85, 105);
    doc.text(`DATE:`, 22, 60);
    doc.setTextColor(0);
    doc.text(`${date}`, 45, 60);

    doc.setTextColor(71, 85, 105);
    doc.text(`UNIT:`, 110, 53);
    doc.setTextColor(0);
    doc.text(`${unit?.name || 'N/A'}`, 135, 53);

    doc.setTextColor(71, 85, 105);
    doc.text(`PROPERTY:`, 110, 60);
    doc.setTextColor(0);
    doc.text(`${unit?.property?.name || 'Main Estate'}`, 135, 60);

    // 4. PAYMENT DETAILS TABLE
    autoTable(doc, {
        startY: 80,
        head: [['Description', 'Payment Method', 'Amount']],
        body: [
            [
                `Rental Payment - ${unit?.name || 'Unit'}`,
                payment.payment_method?.toUpperCase(),
                `${profile?.currency || 'KES'} ${Number(payment.amount_paid).toLocaleString()}`
            ]
        ],
        headStyles: { 
            fillColor: [37, 99, 235], 
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            2: { halign: 'right', fontStyle: 'bold' }
        },
        styles: { fontSize: 10, cellPadding: 6 },
        margin: { left: 15, right: 15 }
    });

    // 5. TOTAL & STATUS
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(40);
    doc.setTextColor(220, 252, 231); 
    doc.text("PAID", 15, finalY + 5);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Received:`, 110, finalY);
    doc.setFontSize(14);
    doc.text(`${profile?.currency || 'KES'} ${Number(payment.amount_paid).toLocaleString()}`, 150, finalY);

    // 6. FOOTER
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const footerText = profile?.company_name 
        ? `Thank you for choosing ${profile.company_name}. For any queries, please contact management.`
        : "Thank you for your payment. For any queries, please contact management.";
        
    doc.text(footerText, 105, 285, { align: 'center' });

    doc.save(`Receipt_${payment.reference || 'Payment'}.pdf`);
};