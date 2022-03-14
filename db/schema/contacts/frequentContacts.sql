DROP TABLE IF EXISTS frequentContacts CASCADE;

CREATE TABLE frequentContacts (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);