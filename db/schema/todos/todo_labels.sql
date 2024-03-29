DROP TABLE IF EXISTS todo_labels CASCADE;

CREATE TABLE todo_labels (
  id SERIAL PRIMARY KEY NOT NULL,
  todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
  label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE
);