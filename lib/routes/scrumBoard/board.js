const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/board/settings/update', (req, res) => {

    const { boardId, settings } = req.body;

    db.query('UPDATE board_settings SET color = $1, subscribed = $2, card_cover_images = $3 WHERE board_id = $4 RETURNING *;', [settings.color, settings.subscribed, settings.cardCoverImages, boardId])
      .then((data) => {
        const resObj = {
          color: data.rows[0].color,
          subscribed: data.rows[0].subscribed,
          cardCoverImages: data.rows[0].card_cover_images
        }

        res.json(resObj);
      })
      .catch(err => console.log(err));

  });

  return router;

}