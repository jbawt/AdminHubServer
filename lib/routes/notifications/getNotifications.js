const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/data', (req, res) => {

    const resObj = [
      {
        id: 'hekdhr34',
        message: 'does it come through?',
        options: {
          variant: 'success',
        },
      },
    ];

    res.json(resObj);

  });

  return router;

}