DROP TABLE IF EXISTS check_list_items CASCADE;

CREATE TABLE check_list_items (
  id SERIAL PRIMARY KEY NOT NULL,
  note_id INTEGER REFERENCES notes(id),
  text VARCHAR(255) NOT NULL,
  checked BOOLEAN NOT NULL
);