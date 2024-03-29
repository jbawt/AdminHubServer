DROP TABLE IF EXISTS notes CASCADE;

CREATE TABLE notes (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  archive BOOLEAN NOT NULL,
  image TEXT,
  time TIMESTAMP,
  reminder TIMESTAMP
);