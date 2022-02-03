DROP TABLE IF EXISTS card_checklists CASCADE;

CREATE TABLE card_checklists (
  id SERIAL PRIMARY KEY NOT NULL,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);