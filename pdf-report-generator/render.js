function buildReportHtml(data) {
  const today = new Date().toISOString().split('T')[0];

  const topProductsRows = data.top_products.map(p => `
    <tr>
      <td>${p.product}</td>
      <td>${p.order_count}</td>
      <td>$${p.revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  const allOrdersRows = data.all_orders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.product}</td>
      <td>$${o.amount.toFixed(2)}</td>
      <td>${o.created_at}</td>
    </tr>
  `).join('');

  return `
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; }
      h1 { font-size: 20px; }
      .totals { display: flex; gap: 40px; margin-bottom: 20px; }
      .totals div { font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
    </style>
  </head>
  <body>
    <h1>Sales Report — ${today}</h1>
    <div class="totals">
      <div><strong>Total Orders:</strong> ${data.total_orders}</div>
      <div><strong>Total Revenue:</strong> $${data.total_revenue.toFixed(2)}</div>
    </div>

    <h2>Top 5 Products</h2>
    <table>
      <thead><tr><th>Product</th><th>Orders</th><th>Revenue</th></tr></thead>
      <tbody>${topProductsRows}</tbody>
    </table>

    <h2>All Orders</h2>
    <table>
      <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead>
      <tbody>${allOrdersRows}</tbody>
    </table>
  </body>
  </html>
  `;
}

module.exports = buildReportHtml;
