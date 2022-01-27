const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 8080;

// SERVER CONFIG
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// DB SETUP
const { Pool } = require('pg');
const dbParams = require('./lib/db');
const db = new Pool(dbParams);
db.connect(() => {
  console.log(`connected to ${dbParams.database} database`);
});

// ROUTES
const login = require('./lib/routes/auth/login');


app.use('/api/login', login(db));

app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});