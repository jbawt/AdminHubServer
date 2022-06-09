const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/contacts', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      try {
        
        const contacts = await db.query(`
          SELECT users.id, first_name, last_name, photourl, mood, status
          FROM users JOIN user_chat_info ON users.id = user_chat_info.user_id
          WHERE users.id != $1;
        `, [claim.id]);
  
        const contactList = contacts.rows.map(contact => {
          return {
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            avatar: contact.photourl,
            status: contact.status,
            mood: contact.mood,
            unread: '0',
          };
        });
  
        res.json(contactList);

      } catch (error) {
        res.sendStatus(500);
      }

    } else {
      res.sendStatus(403);
    }

  });

  return router;

};