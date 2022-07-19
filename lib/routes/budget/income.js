const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/income', (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('SELECT income FROM income WHERE user_id = $1;', [claim.id])
        .then(data => {
          res.json(data.rows[0]);
        })
        .catch(err => console.log(err));
      
    } else {
      res.sendStatus(403);
    }

  });

  return router;

};