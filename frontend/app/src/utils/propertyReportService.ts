import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePropertyReportPDF = (property: any, summary: any, unitsList: any[]) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    // 1. GLOBAL WATERMARK (For Audit Security)
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    doc.setFontSize(60);
    doc.setTextColor(150);
    doc.text("OFFICIAL RECORD", 35, 150, { angle: 45 });
    doc.restoreGraphicsState();

    // 2. LOGO & HEADER
    const logoUrl = '/rentwise_logo.jpeg';
    try {
        doc.addImage(logoUrl, 'JPEG', 15, 12, 22, 22);
    } catch (e) { /* Fallback if logo missing */ }

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("PROPERTY PERFORMANCE AUDIT", 42, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`PROPERTY ID: ${property.id.toUpperCase()}`, 42, 28);
    doc.text(`REPORTING PERIOD: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 42, 33);
    doc.text(`GENERATED ON: ${date}`, 42, 38);

    // 3. EXECUTIVE SUMMARY (Financial Summary Data )
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 45, 180, 50, 2, 2, 'F');

    const headers = ["POTENTIAL REVENUE", "ACTUAL COLLECTION", "OUTSTANDING ARREARS"];
    const values = [
        `KES ${summary.expected.toLocaleString()}`,
        `KES ${summary.paid.toLocaleString()}`,
        `KES ${summary.balance.toLocaleString()}`
    ];

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(headers[0], 25, 55);
    doc.text(headers[1], 85, 55);
    doc.text(headers[2], 145, 55);

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(values[0], 25, 63);
    doc.setTextColor(5, 150, 105); 
    doc.text(values[1], 85, 63);
    doc.setTextColor(220, 38, 38); 
    doc.text(values[2], 145, 63);

    // Secondary metrics from the rent.py logic 
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("OCCUPANCY RATE", 25, 78);
    doc.text("TOTAL CREDITS", 85, 78);
    doc.text("UNIT COMPLIANCE", 145, 78);

    const occupancy = ((summary.occupied_units / summary.total_units) * 100).toFixed(1);
    const compliance = ((summary.paid_units / summary.occupied_units) * 100).toFixed(1);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`${occupancy}%`, 25, 86);
    doc.text(`KES ${summary.total_credits.toLocaleString()}`, 85, 86);
    doc.text(`${compliance}% PAID`, 145, 86);

    // 4. DETAILED UNIT LEDGER 
    autoTable(doc, {
        startY: 105,
        head: [['UNIT', 'TENANT', 'MONTHLY RENT', 'PAID (MONTH)', 'BALANCE (TOTAL)', 'STATUS']],
        body: unitsList.map(u => {
            // Using the synced rent_status field from the new Serializer
            const s = u.rent_status || { rent: u.monthly_rent, paid: 0, balance: 0, status: u.status };
            return [
                u.name,
                u.tenant_names || (u.status === 'vacant' ? '-- VACANT --' : 'Unknown'),
                Number(s.rent).toLocaleString(),
                Number(s.paid).toLocaleString(),
                Number(s.balance).toLocaleString(),
                s.status.toUpperCase()
            ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'center' }
        },
        didParseCell: (data) => {
            if (data.column.index === 4 && data.cell.section === 'body') {
                const val = parseFloat(data.cell.text[0].replace(/,/g, ''));
                if (val > 0) data.cell.styles.textColor = [220, 38, 38]; // Red for debt
                if (val < 0) data.cell.styles.textColor = [5, 150, 105]; // Green for credit
            }
        }
    });

    // 5. AUDIT FOOTER
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Property: ${property.name} | Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 15, 285);
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
        doc.setDrawColor(230);
        doc.line(15, 282, 195, 282);
    }

    doc.save(`${property.name.replace(/\s+/g, '_')}_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};