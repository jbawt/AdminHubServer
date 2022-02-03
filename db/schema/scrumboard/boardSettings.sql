DROP TABLE IF EXISTS board_settings CASCADE;

CREATE TABLE board_settings (
  id SERIAL PRIMARY KEY NOT NULL,
  board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  color VARCHAR(255) NOT NULL,
  subscribed BOOLEAN NOT NULL,
  card_cover_images BOOLEAN NOT NULL
);