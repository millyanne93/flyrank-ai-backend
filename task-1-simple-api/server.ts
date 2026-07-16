import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;


app.get('/', (req: Request, res: Response): void=> {
  res.json({ message: 'Hello world!'});
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
