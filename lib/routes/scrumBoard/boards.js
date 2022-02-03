const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/board/new', (req, res) => {

    const { name, uri, id, settings, lists, cards, members, labels } = req.body.board;
    // console.log(members);
    // console.log(labels);

  });

  return router;

};