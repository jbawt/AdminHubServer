DROP TABLE IF EXISTS user_chats CASCADE;

CREATE TABLE user_chats (
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_message_date DATE NOT NULL
);