DROP TABLE IF EXISTS cards CASCADE;

CREATE TABLE cards (
  id SERIAL PRIMARY KEY NOT NULL,
  list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  id_attachment_cover INTEGER,
  subscribed BOOLEAN NOT NULL,
  due TIMESTAMP
);