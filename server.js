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
const calendar = require('./lib/routes/calendar/calendar');
const drive = require('./lib/routes/fileManager/fileManager');
const gmail = require('./lib/routes/mail/mail');
const notificationPanel = require('./lib/routes/notifications/getNotifications');
const contacts = require('./lib/routes/contacts/contacts');
const about = require('./lib/routes/user/about');
const widgets = require('./lib/routes/dashboards/scrumboards/widgets');
const scrumboards = require('./lib/routes/dashboards/scrumboards/scrumboards');
const gitAuth = require('./lib/routes/auth/gitAuth');
const userChatInfo = require('./lib/routes/chat/userData');
const chatContacts = require('./lib/routes/chat/contacts');
const chats = require('./lib/routes/chat/chats');
const income = require('./lib/routes/budget/income');
const expenses = require('./lib/routes/budget/expenses');

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
app.use('/api/calendar-app', calendar(db));
app.use('/api/file-manager-app', drive(db));
app.use('/api/mail-app', gmail(db));
app.use('/api/notification-panel', notificationPanel(db));
app.use('/api/contacts-app', contacts(db));
app.use('/api/profile', about(db));
app.use('/api/project-dashboard-app', widgets(db));
app.use('/api/project-dashboard-app', scrumboards(db));
app.use('/api/github', gitAuth(db));
app.use('/api/chat', userChatInfo(db));
app.use('/api/chat', chatContacts(db));
app.use('/api/chat', chats(db));
app.use('/api/budget', income(db));
app.use('/api/budget', expenses(db));


app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});