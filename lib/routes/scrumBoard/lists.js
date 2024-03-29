const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/list/new', (req, res) => {

    const { boardId, data } = req.body;

    db.query('INSERT INTO lists (board_id, name, list_order, draggable_id) VALUES ($1, $2, (SELECT COALESCE(MAX(list_order), 0) + 1 FROM lists WHERE board_id = $1), $3);', [boardId, data.name, data.id])
      .then(async () => {

        const lists = await db.query('SELECT * FROM lists WHERE board_id = $1', [boardId]);
        const listsWithCardIds = await Promise.all(lists.rows.map(async (list) => {

          const listData = {
            id: list.id,
            draggableId: list.draggable_id,
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

  router.post('/list/order', async (req, res) => {
    
    const { lists, boardId } = req.body; 
    
    const newList = await Promise.all(lists.map( async (list, index) => {

      await db.query('UPDATE lists SET list_order = $1 WHERE board_id = $2 AND id = $3;', [(index + 1), boardId, list.id])

      list.list_order = (index + 1);

      return list;

    }))

    res.json(newList);
    
  });

  router.post('/card/order', async (req, res) => {
    
    const { boardId, lists } = req.body;

    await Promise.all(lists.map(async (list) => {

      if (list.draggableCardIds.length > 0) {

        await Promise.all(list.draggableCardIds.map(async (cardId, index) => {
  
          await db.query('UPDATE cards SET card_order = $1, list_id = $2 WHERE draggable_id = $3;', [(index + 1), list.id, cardId]);
  
        }))
        .catch(err => console.log(err));

      }

    }))
    .catch(err => console.log(err));
    
    res.json(lists);

  })

  return router;

}