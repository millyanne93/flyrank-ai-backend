const express = require('express');
const db = require('./database');
const generatePdf = require('./pdf');

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/reports', async (req, res) => {
  try {
    const force = req.body?.force === true;

    if (!force) {
      const existing = db.prepare(`
        SELECT * FROM reports
        WHERE date(created_at) = date('now')
        ORDER BY created_at DESC
        LIMIT 1
      `).get();

      if (existing) {
        return res.status(200).json({
          id: existing.id,
          file: `/reports/${existing.id}/file`
        });
      }
    }

    const outputPath = `reports/${Date.now()}.pdf`;
    await generatePdf(outputPath);

    const now = new Date().toISOString();
    const result = db.prepare(
      `INSERT INTO reports (path, created_at) VALUES (?, ?)`
    ).run(outputPath, now);

    res.status(201).json({
      id: result.lastInsertRowid,
      file: `/reports/${result.lastInsertRowid}/file`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /reports/:id — the record
app.get('/reports/:id', (req, res) => {
  const report = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

// GET /reports/:id/file — serves the actual PDF bytes
app.get('/reports/:id/file', (req, res) => {
  const report = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.sendFile(report.path, { root: __dirname });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
