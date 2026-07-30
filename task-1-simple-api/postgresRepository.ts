import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

//Stage 1 Get all tasks
export async function getAllTasks() {
  const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id');
  return rows;
}

// Get task by Id
export async function getTaskById(id:number) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0] || null;
}
export async function createTask(title: string) {
  const  { rows } = await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *', [title, false]);
  return rows[0];
}

export async function updateTask(id: number, title?: string, done?: boolean) {
  const existing = await getTaskById(id) as any;
  if (!existing) return null;

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? done : existing.done;

  const { rows } = await pool.query('UPDATE tasks SET title = $1, done = $2, updated_at = now() WHERE id = $3 RETURNING *', [newTitle, newDone, id]);
  return rows[0];
}

export async function deleteTask(id: number) {
  const existing = await getTaskById(id);
  if (!existing) return false;

  await pool.query('DELETE FROM tasks WHERE id = $1',[id]);
  return true;
}

export async function resetTasks() {
  await pool.query('DELETE FROM tasks');
  await pool.query (`INSERT INTO tasks (title, done) VALUES 
  ('Learn Typescript', false),
  ('Build CRUD API', false),
  ('Submit assignment', false)`);
  return getAllTasks();
}
// Extra: Search
export async function searchTasks(searchTerm: string) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE title ILIKE $1 ORDER BY id', [`%${searchTerm}%`]);
  return rows;
}

// Extra: Filter by done
export async function getTasksByDone(done: boolean) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE done = $1 ORDER BY id', [done]);
  return rows;
}

// Extra: Sort alphabetically
export async function getTasksSortedByTitle() {
  const { rows } = await pool.query('SELECT * FROM tasks ORDER BY title');
  return rows;
}

// Extra: Stats using SQL COUNT()
export async function getStats() {
  const total = parseInt((await pool.query('SELECT COUNT(*) as c FROM tasks')).rows[0].c);
  const done = parseInt((await pool.query('SELECT COUNT(*) as c FROM tasks WHERE done = true')).rows[0].c);
  return { total, done, open: total - done };
}

export default pool;
