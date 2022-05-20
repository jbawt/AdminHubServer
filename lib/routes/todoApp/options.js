const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/filters', (req, res) => {
    db.query('SELECT * FROM filters;')
      .then(data => {
        res.json(data.rows);
      })
      .catch(err => console.log(err));
  });

  router.get('/folders', (req, res) => {
    db.query('SELECT * FROM folders;')
      .then(data => {
        res.json(data.rows);
      })
      .catch(err => console.log(err));
  });

  router.get('/labels', (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('SELECT * FROM labels WHERE user_id = $1;', [claim.id])
      .then(data => {
        res.json(data.rows);
      })
      .catch(err => console.log(err));
    } else {
      res.sendStatus(403);
    }
  });

  router.post('/add-label', (req, res) => {
    const { title, color, handle } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('INSERT INTO labels (handle, title, color, user_id) VALUES ($1, $2, $3, $4);', [handle, title, color, claim.id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  router.post('/remove-label', (req, res) => {
    const { labelId } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('DELETE FROM todo_labels WHERE label_id = $1;', [labelId])
        .then(() => {
          db.query('DELETE FROM labels WHERE id = $1 AND user_id = $2;', [labelId, claim.id])
            .then(() => {
              res.sendStatus(200);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
      
    } else {
      res.sendStatus(403);
    };

  });

  return router;

}