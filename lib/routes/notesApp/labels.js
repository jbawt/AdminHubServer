const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/labels', (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];

    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      db.query('SELECT * FROM note_labels WHERE user_id = $1;', [claim.id])
        .then(data => {
          res.json(data.rows);
        })
        .catch(err => console.log(err));
    }


  });

  router.post('/update-labels', (req, res) => {

    const { labels } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    // console.log(labels);

    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      db.query('DELETE FROM note_labels WHERE user_id = $1;', [claim.id])
        .then(() => {

          const data = [];

          Promise.all(labels.map(async label => {
            
            const newLabel = await db.query('INSERT INTO note_labels (user_id, name, handle) VALUES ($1, $2, $3) RETURNING *;', [claim.id, label.name, label.handle]);

            return newLabel.rows[0];
            
          }))
          .then((newLabel) => {
            res.json(newLabel);
          })
          .catch(err => console.log(err));

        })
        .catch(err => console.log(err));

    }

  });

  return router;

}