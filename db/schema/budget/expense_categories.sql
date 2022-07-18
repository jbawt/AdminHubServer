DROP TABLE IF EXISTS expense_categories CASCADE;

CREATE TABLE expense_categories (
  id SERIAL PRIMARY KEY NOT NULL,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  expense_name VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL
);