const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/goals', (req, res) => {
    console.log('you have hit route "api/budget/goals"');
  });

  return router;

};