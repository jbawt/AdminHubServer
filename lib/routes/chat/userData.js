const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/user', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const resObj = {};

      try {
        
        const userInfo = await db.query('SELECT id, first_name, last_name, photourl FROM users WHERE id = $1;', [claim.id]);
        const user = userInfo.rows[0];
  
        resObj.id = user.id;
        resObj.name = `${user.first_name} ${user.last_name}`;
        resObj.avatar = user.photourl;

        const userChatInfo = await db.query('SELECT status, mood FROM user_chat_info WHERE user_id = $1;', [claim.id]);
        const info = userChatInfo.rows[0];

        resObj.status = info.status;
        resObj.mood = info.mood;

        const chatList = await db.query('SELECT id, contact_id, last_message_date FROM user_chats WHERE user_id = $1 OR contact_id = $1;', [claim.id]);
        const chatListArr = chatList.rows.map(chat => {
          return {
            chatId: chat.id,
            contactId: chat.contact_id,
            lastMessageTime: chat.last_message_date.toISOString()
          }
        });

        resObj.chatList = chatListArr;

        res.json(resObj);

      } catch (error) {
        res.sendStatus(500);
      }
      

    } else {
      res.sendStatus(403);
    }


  });

  return router;

}