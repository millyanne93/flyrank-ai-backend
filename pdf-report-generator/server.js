const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
