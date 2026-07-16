import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;


app.get('/hello', (req: Request, res: Response): void => {
  res.json({ message: 'Hello world!'});
});

app.get('/', (req: Request, res: Response): void => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks']
  });
});
app.get('/health', (req: Request, res: Response):void => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
