DROP TABLE IF EXISTS expense_amount CASCADE;

CREATE TABLE expense_amount (
  id SERIAL PRIMARY KEY NOT NULL,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  amount NUMERIC (5, 2) NOT NULL
);