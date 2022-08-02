const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/expenses', (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const query = `
        SELECT user_id, date, name, expense_amount.amount AS total
        FROM expenses JOIN expense_amount ON expenses.id = expense_amount.expense_id
        WHERE user_id = $1;
      `;

      db.query(query, [claim.id])
        .then(data => {
          const resObj = { expenses: data.rows }
          res.json(resObj);
        })
        .catch(err => console.log(err));
      
    } else {
      res.sendStatus(403);
    }

  });

  return router;

};