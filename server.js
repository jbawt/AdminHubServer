const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 8080;

// SERVER CONFIG
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
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
const updateUser = require('./lib/routes/user/user');
const tokenLogin = require('./lib/routes/auth/tokenLogin');
const todoOptions = require('./lib/routes/todoApp/options');
const todos = require('./lib/routes/todoApp/todos');
const noteLabels = require('./lib/routes/notesApp/labels');
const notes = require('./lib/routes/notesApp/notes');
const quickPanel = require('./lib/routes/quickPanel/data');
const boards = require('./lib/routes/scrumBoard/boards');
const board = require('./lib/routes/scrumBoard/board');
const cards = require('./lib/routes/scrumBoard/cards');
const lists = require('./lib/routes/scrumBoard/lists');

app.use('/api/login', login(db));
app.use('/api/auth/user', updateUser(db));
app.use('/api/auth/access-token', tokenLogin(db));
app.use('/api/todo-app', todoOptions(db));
app.use('/api/todo-app', todos(db));
app.use('/api/notes-app', noteLabels(db));
app.use('/api/notes-app', notes(db));
app.use('/api/quick-panel', quickPanel(db));
app.use('/api/scrumboard-app', boards(db));
app.use('/api/scrumboard-app', cards(db));
app.use('/api/scrumboard-app', board(db));
app.use('/api/scrumboard-app', lists(db));


app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});