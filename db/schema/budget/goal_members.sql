DROP TABLE IF EXISTS goal_members CASCADE;

CREATE TABLE goal_members (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE
);