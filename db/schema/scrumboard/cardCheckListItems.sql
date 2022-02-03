DROP TABLE IF EXISTS card_checklist_items CASCADE;

CREATE TABLE card_checklist_items (
  id SERIAL PRIMARY KEY NOT NULL,
  card_checklist_id INTEGER REFERENCES card_checklists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  checked BOOLEAN NOT NULL
);