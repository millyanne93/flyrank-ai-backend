import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';
import './database';
import {getAllTasks, getTaskById } from './database';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve,swaggerUi.setup(openapi));

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
  const tasks = getAllTasks();
  res.json(tasks);
});

//get /task/:id
app.get('/tasks/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = getTaskById(id);
  
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
//Post /task  create task
app.post('/tasks', (req: Request, res: Response) => {
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

//PUT /tasks/:id - update a task
app.put('/tasks/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'At least one field(title or done) is required' });
  }

  if (title !== undefined) {
    if (title.trim() === '') {
      return res.status(400).json({ error:'Title cannot be empty' });
    }
    task.title = title.trim();
  }
    
  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean'});
    }
    task.done = done;
  }
  res.json(task);
});

// DELETE /tasks/:id 
app.delete( '/tasks/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  tasks.splice(index, 1);
  res.status(204).send();
});

// GET /stats - task statistics 
app.get('/stats', (req: Request, res: Response) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const open = total - done;

  res.json({ total, done, open});
});

//POST /reset- reset to default tasks
app.post('/reset', (req: Request, res: Response) => {
  tasks = [
      { id: 1, title: 'Learn Typescript', done: false },
      { id: 2, title: 'Build CRUD API', done: false },
      { id: 3, title: 'Submt assignment', done: false },
  ];
  nextId = 4;
  res.status(200).json({ message: 'Tasks reset to default', tasks})
});  

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});
