import Database from 'better-sqlite3';

const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);

const row = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };

if (row.count === 0) {
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Learn Typescript', 0);
  insert.run('Build CRUD API', 0);
  insert.run('Submit assignment', 0);
}

console.log('Database ready');

//Stage 1 Get all tasks
export function getAllTasks() {
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY id');
  return stmt.all();
}

// Get task by Id
export function getTaskById(id:number) {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id);
}  
export function createTask(title: string) {
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const result = insert.run(title, 0);
  return getTaskById(result.lastInsertRowid as number);
}

export function updateTask(id: number, title?: string, done?: boolean) {
  const existing = getTaskById(id) as any;
  if (!existing) return null;

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;
  
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
  return getTaskById(id);
}  

export function deleteTask(id: number) {
  const existing = getTaskById(id);
  if (!existing) return false;
  
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return true;
}  

export default db;

