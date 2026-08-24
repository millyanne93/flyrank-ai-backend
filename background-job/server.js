const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('./inngest/client');
const { sayHello, makeReport, heartbeat } = require('./inngest/functions');
const { reports } = require('./store');

const app = express();
const PORT = 3000;

app.use(express.json());


// Serve Inngest functions
app.use('/api/inngest', serve({
  client: inngest,
  functions: [sayHello, makeReport, heartbeat],
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/reports', async( req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'topic is required' });
  }

  const id = Date.now().toString();
  reports[id] = { id, topic, status: 'pending' };

  await inngest.send({
    name: 'report/requested',
    data: { id, topic },
  });

  res.status(202).json({ id, status: 'pending' });
});

app.get('/reports', (req, res) => {
  const reportList = Object.values(reports);
  res.json(reportList);
});

app.get('/reports/:id', (req, res) => {
  const report = reports[req.params.id];
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
