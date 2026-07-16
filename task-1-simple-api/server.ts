import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

//in-memory task list
let tasks: { id: number; title: string; done: boolean }[] =[
  { id: 1, title: 'Learn Typescript', done: false },
  { id: 2, title: 'Build CRUD API', done: false },
  { id: 3, title: 'Submt assignment', done: false },
];

let nextId = 4;

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
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

// get task list
app.get('/tasks', (req: Request, res: Response) => {
  res.json(tasks);
});

//get /task/:id
app.get('/tasks/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
//Post /task  create task
app.post('/tasks', (req: Request, res: Response,) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and cannot be empty'});
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    done: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
