DROP TABLE IF EXISTS boards CASCADE;

CREATE TABLE boards (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  uri VARCHAR(255) NOT NULL
);