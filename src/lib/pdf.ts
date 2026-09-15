type ReportData = {
  totalSales: number;
  transactions: number;
  profit: number;
  topProduct: string;
  lowStock: Array<{ name: string; quantity: number; min_threshold: number }>;
  discrepancies: number;
  savedAmount: number;
};

export async function exportReport(data: ReportData): Promise<void> {
  const {
    totalSales,
    transactions,
    profit,
    topProduct,
    lowStock,
    discrepancies,
    savedAmount,
  } = data;

  const date = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const lowStockRows = lowStock
    .slice(0, 15)
    .map((i) => `  • ${i.name}: ${i.quantity} (min ${i.min_threshold})`)
    .join('\n');

  const report = `
╔══════════════════════════════════════════╗
║     المخزون الذكي — Smart Inventory      ║
║        Executive Summary Report          ║
╚══════════════════════════════════════════╝

Generated: ${date}

────────────── KPIs ──────────────
  Total Sales:      ${totalSales.toFixed(2)} SAR
  Transactions:     ${transactions}
  Profit:           ${profit.toFixed(2)} SAR
  Top Product:      ${topProduct}

────────── Low Stock Alerts ──────────
${lowStockRows || '  None'}

────────── Discrepancies ──────────
  Total flagged:    ${discrepancies}

────────── Savings ──────────
  Estimated savings from leak detection: ${savedAmount.toFixed(2)} SAR

═══════════════════════════════════════════
`;

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smart-inventory-report-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
