const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/get-chat', async (req, res) => {
    const { contactId, userId } = req.query;

    try {
      
      const userChatList = await db.query('SELECT id, contact_id, last_message_date FROM user_chats WHERE user_id = $1;', [userId]);
      const chatList = userChatList.rows.map(chat => {
        return {
          chatId: chat.id,
          contactId: chat.contact_id,
          lastMessageTime: chat.last_message_date.toISOString(),
        }
      });
      const chatId = userChatList.rows.map(chat => {
        if (chat.contact_id === parseInt(contactId)) {
          return chat.id;
        } else {
          return null;
        }
      })[0];

      const dialogs = await db.query('SELECT sender_id, message, time FROM dialogs WHERE user_chat_id = $1;', [chatId]);
      const dialogList = dialogs.rows.map(dialog => {
        return {
          who: dialog.sender_id,
          message: dialog.message,
          time: dialog.time.toISOString(),
        }
      });
  
      res.json({
        chat: {
          id: chatId,
          dialog: dialogList
        },
        userChatList: chatList,
      });
  

    } catch (error) {
      res.sendStatus(500);
    }


  });

  return router;

}