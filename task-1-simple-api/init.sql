CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO tasks (title)
SELECT * FROM (VALUES ('Learn Typescript'), ('Build CRUD API'), ('Submit assignment')) AS seed(title)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
