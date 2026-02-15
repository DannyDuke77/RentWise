export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;

    // 1. Define Headers
    const headers = ["Date", "Reference", "Method", "Amount (KES)", "Type"];

    // 2. Map Data to Rows
    const rows = data.map(p => [
        new Date(p.paid_on).toLocaleDateString('en-GB'),
        p.reference || 'N/A',
        p.payment_method?.toUpperCase(),
        Number(p.amount_paid).toFixed(2),
        p.type
    ]);

    // 3. Construct CSV String
    const csvContent = [
        // CSV Header uppercase + bold
        headers.join(",").toUpperCase(),
        ...rows.map(row => row.join(","))
    ].join("\n");

    // 4. Trigger Download (with Excel UTF-8 Fix)
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};