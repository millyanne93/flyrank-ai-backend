import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello, world!' });
});

app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'pong' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`- http://localhost:${PORT}/`);
  console.log(`- http://localhost:${PORT}/ping`);
});
