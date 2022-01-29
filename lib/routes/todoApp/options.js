const router = require('express').Router();

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
    db.query('SELECT * FROM labels;')
      .then(data => {
        res.json(data.rows);
      })
      .catch(err => console.log(err));
  });

  return router;

}