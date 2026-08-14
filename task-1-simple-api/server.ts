import "dotenv/config";

import express, { Request, Response } from 'express';
import { z } from "zod";
import { ClassifyOutputSchema } from "./src/llm/schema";
import { classifyTask } from './src/llm/classify';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  resetTasks,
  searchTasks,
  getTasksByDone,
  getTasksSortedByTitle,
  getStats
} from './postgresRepository';

const app = express();
const PORT = 3000;
const ClassifyInputSchema = z.object({
  title: z.string().min(1).max(200),
});

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
app.get('/tasks', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const done = req.query.done as string | undefined;
  const sort = req.query.sort as string | undefined;
  
  let tasks;

  if (search) {
    tasks = await searchTasks(search);
  } else if (done !== undefined) {
    tasks = await getTasksByDone(done === 'true');
  } else if (sort === 'title') {
    tasks = await getTasksSortedByTitle();
  } else {
    tasks = await getAllTasks();
  }

  res.json(tasks);
});

//get /task/:id
app.get('/tasks/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = await getTaskById(id);
  
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});
//Post /task  create task
app.post('/tasks', async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and cannot be empty'});
  }

  const newTask = await createTask(title.trim());

  res.status(201).json(newTask);
});
app.post('/tasks/:id/classify', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = await getTaskById(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const parsed = ClassifyInputSchema.safeParse({ title: task.title });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  if (process.env.LLM_STUB === '1') {
    return res.json({
      category: "work",
      priority: "medium",
      confidence: 0.5,
      reason: "stub mode — no model called",
    });
  }

  const rawResult = await classifyTask(parsed.data.title);
  res.json({ raw: rawResult });
});

//PUT /tasks/:id - update a task
app.put('/tasks/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = await getTaskById(id);

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
  }
    
  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean'});
    }
  }
  const updated = await updateTask(id, title !== undefined ? title.trim() : undefined, done);

  res.json(updated);
});

// DELETE /tasks/:id 
app.delete( '/tasks/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const deleted = await deleteTask(id);

  if (!deleted) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  
  res.status(204).send();
});

// GET /stats - task statistics 
app.get('/stats', async (req: Request, res: Response) => {
  const stats = await getStats();

  res.json(stats);
});

//POST /reset- reset to default tasks
app.post('/reset', async(req: Request, res: Response) => {
  const tasks = await resetTasks();
  res.status(200).json({ message: 'Tasks reset to default', tasks})
});  

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});
