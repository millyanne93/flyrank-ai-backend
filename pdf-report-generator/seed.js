const db = require('./database');

// Clear existing data
db.exec('DELETE FROM orders');

// Generate 200 random orders
const products = ['Laptop', 'Phone', 'Headphones', 'Keyboard', 'Mouse', 'Monitor'];
const customers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];

const insert = db.prepare(`
  INSERT INTO orders (customer, product, amount, created_at)
  VALUES (?, ?, ?, ?)
`);

const now = new Date();
for (let i = 0; i < 200; i++) {
  const product = products[Math.floor(Math.random() * products.length)];
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const amount = Math.round((Math.random() * 195 + 5) * 100) / 100;
  
  const date = new Date(now);
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  const dateStr = date.toISOString().split('T')[0];

  insert.run(customer, product, amount, dateStr);
}

console.log(' 200 orders seeded');

// Verify
const count = db.prepare('SELECT COUNT(*) as count FROM orders').get();
console.log(` Total orders: ${count.count}`);
