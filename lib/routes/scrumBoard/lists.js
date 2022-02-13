const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/list/new', (req, res) => {

    const { boardId, data } = req.body;

    db.query('INSERT INTO lists (board_id, name) VALUES ($1, $2);', [boardId, data.name])
      .then(async () => {

        const lists = await db.query('SELECT * FROM lists WHERE board_id = $1', [boardId]);
        const listsWithCardIds = await Promise.all(lists.rows.map(async (list) => {

          const listData = {
            id: list.id,
            name: list.name,
            idCards: []
          };

          const listIds = await db.query('SELECT id FROM cards WHERE list_id = $1', [list.id])
          listIds.rows.map(id => {
            if (id.id !== undefined) {
              listData.idCards = [...listData.idCards, id.id];
            };
          });

          return listData;

        }))
        .catch(err => console.log(err));

        const resObj = listsWithCardIds;

        res.json(resObj);
      })
      .catch(err => console.log(err));

  });

  router.post('/list/remove', (req, res) => {

    const { boardId, listId } = req.body;

    db.query('DELETE FROM lists WHERE id = $1;', [listId])
      .then(() => {
        res.json(listId);
      })
      .catch(err => console.log(err));

  });

  router.post('/list/rename', (req, res) => {

    const { boardId, listId, listTitle } = req.body;

    db.query('UPDATE lists SET name = $1 WHERE id = $2 RETURNING *;', [listTitle, listId])
      .then((data) => {
        
        const resObj = {
          listId: data.rows[0].id,
          listTitle: data.rows[0].name
        }

        res.json(resObj);

      })
      .catch(err => console.log(err));

  });

  router.post('/list/order', (req, res) => {
    console.log(req.body);
  });

  return router;

}