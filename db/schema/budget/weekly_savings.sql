DROP TABLE IF EXISTS weekly_savings CASCADE;

CREATE TABLE weekly_savings (
  id SERIAL PRIMARY KEY NOT NULL,
  goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  week_start TIMESTAMP NOT NULL,
  week_end TIMESTAMP NOT NULL,
  amount INTEGER NOT NULL
);