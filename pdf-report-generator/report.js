const db = require('./database');

function getReportData() {
  // 1. Total orders and total revenue
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(amount) as total_revenue
    FROM orders
  `).get();

  // 2. Top 5 products by revenue
  const topProducts = db.prepare(`
    SELECT
      product,
      COUNT(*) as order_count,
      SUM(amount) as revenue
    FROM orders
    GROUP BY product
    ORDER BY revenue DESC
    LIMIT 5
  `).all();

  // 3. Orders per day for last 7 days
  const dailyOrders = db.prepare(`
    SELECT
      created_at as date,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= date('now', '-7 days')
    GROUP BY created_at
    ORDER BY created_at DESC
  `).all();

  // 4. All orders (needed for the long table in the PDF)
  const allOrders = db.prepare(`
    SELECT * FROM orders ORDER BY created_at DESC
  `).all();

  return {
    total_orders: totals.total_orders,
    total_revenue: totals.total_revenue,
    top_products: topProducts,
    daily_orders: dailyOrders,
    all_orders: allOrders
  };
}

// Test script
if (require.main === module) {
  const data = getReportData();
  console.log(JSON.stringify(data, null, 2));
}

module.exports = getReportData;
