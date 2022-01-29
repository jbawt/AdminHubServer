const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/todos', (req, res) => {

    const type = req.query;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];

    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('SELECT * FROM todos where user_id = $1;', [claim.id])
          .then(todos => {
              
            Promise.all(todos.rows.map(async (todo) => {
  
              const labels = await db.query('SELECT labels.id FROM todo_labels JOIN labels ON todo_labels.label_id = labels.id WHERE todo_id = $1;', [todo.id]);
              todo.startDate = todo.start_date;
              todo.dueDate = todo.due_date;
              delete todo.start_date;
              delete todo.due_date;
  
              const labelIds = [];
  
              labels.rows.forEach(label => labelIds.push(label.id));
  
              todo.labels = labelIds;
  
            }))
            .then(async () => {
              if (type.folderHandle) {
                
                if (type.folderHandle === 'all') {
                  res.json(todos.rows);
                }

              } else if (type.filterHandle) {

                if (type.filterHandle === 'delete') {
                  const deletedTodos = todos.rows.filter(todo => todo.deleted);
                  res.json(deletedTodos);
                } else {
                  const filteredTodos = todos.rows.filter(todo => todo[type.filterHandle] && !todo.deleted);
                  res.json(filteredTodos);
                }

              } else if (type.labelHandle) {
                
                const labelId = await db.query('SELECT id FROM labels WHERE handle = $1', [type.labelHandle]);
                const filteredTodos = todos.rows.filter(todo => todo.labels.includes(labelId.rows[0].id) && !todo.deleted);
                res.json(filteredTodos);

              }
            })
            .catch(err => console.log(err));
    
          })
          .catch(err => console.log(err));

    }

  });

  router.post('/new-todo', (req, res) => {

    const { title, notes, startDate, dueDate, completed, starred, important, deleted, labels } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];;
    
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query(`
        INSERT INTO todos (user_id, title, notes, start_date, due_date, completed, starred, important, deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
      `, [claim.id, title, notes, startDate, dueDate, completed, starred, important, deleted])
        .then(data => {
          const todo = data.rows[0];
          Promise.all(labels.map( async (id) => {

            await db.query('INSERT INTO todo_labels (todo_id, label_id) VALUES ($1, $2);', [todo.id, id]);

          }))
          .then(() => {
            todo.labels = labels;
            res.json(todo);
          })
          .catch(err => console.log(err));

        })
        .catch(err => console.log(err));

    }

  });

  router.post('/update-todo', (req, res) => {

    const {id, title, notes, startDate, dueDate, completed, starred, important, labels } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      db.query(`
        UPDATE todos SET title = $1, notes = $2, start_date = $3, due_date = $4, completed = $5, starred = $6, important = $7 WHERE id = $8 RETURNING *;
      `, [title, notes, startDate, dueDate, completed, starred, important, id])
        .then(async (data) => {
          const todo = data.rows[0];
          const currentLabels = await db.query('SELECT * FROM todo_labels WHERE todo_id = $1', [todo.id])

          Promise.all(currentLabels.rows.map( async (todoLabel) => {

            await db.query('DELETE FROM todo_labels WHERE id = $1', [todoLabel.id]);

          }))
          .then(() => {
            Promise.all(labels.map(async (id) => {

              await db.query('INSERT INTO todo_labels (todo_id, label_id) VALUES ($1, $2);', [todo.id, id]);

            }))
            .then(() => {
              todo.labels = labels;
              res.json(todo);
            })
            .catch(err => console.log(err));
          })
          .catch(err => console.log(err));

        })
        .catch(err => console.log(err));

    }

  })

  return router;

}