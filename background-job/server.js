const express = require('express');
const { serve } = require('inngest/express');
const { inngest } = require('./inngest/client');
const { sayHello } = require('./inngest/functions');

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve Inngest functions
app.use('/api/inngest', serve({
  client: inngest,
  functions: [sayHello],
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
