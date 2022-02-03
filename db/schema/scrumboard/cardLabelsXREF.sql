DROP TABLE IF EXISTS card_labels_xref CASCADE;

CREATE TABLE card_labels_xref (
  id SERIAL PRIMARY KEY NOT NULL,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  board_label_id INTEGER REFERENCES board_labels(id) ON DELETE CASCADE
);