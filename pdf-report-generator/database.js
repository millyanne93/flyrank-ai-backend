const Database = require('node:sqlite').DatabaseSync;
const path = require('path');

const dbPath = path.join(__dirname, 'report.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`);

module.exports = db;

