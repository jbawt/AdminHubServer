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

      if (chatId !== null) {

        const dialogs = await db.query('SELECT sender_id, message, time FROM dialogs WHERE user_chat_id = $1;', [chatId]);
        const dialogList = dialogs.rows.map(dialog => {
          return {
            who: dialog.sender_id,
            message: dialog.message,
            time: dialog.time,
          }
        });
    
        res.json({
          chat: {
            id: chatId,
            dialog: dialogList
          },
          userChatList: chatList,
        });

      } else {

        const newChat = await db.query('INSERT INTO user_chats (user_id, contact_id) VALUES ($1, $2) RETURNING *;', [userId, contactId])
        const newChatData = newChat.rows[0];

        const newChatObj = {
          chatId: newChatData.id,
          contactId: newChatData.contact_id,
          lastMessageTime: newChatData.last_message_date,
        };

        res.json({
          chat: {
            id: newChatObj.id,
            dialog: [],
          },
          userChatList: [...chatList, newChatObj],
        });

      }
  

    } catch (error) {
      res.sendStatus(500);
    }


  });

  router.post('/send-message', async (req, res) => {
    const { authorization } = req.headers;
    const { chatId, messageText, contactId } = req.body;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const currentDateString = new Date(Date.now()).toISOString();

      try {
        
        const newMessageIns = await db.query(`
          INSERT INTO dialogs (sender_id, user_chat_id, message, time) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *;
        `, [claim.id, chatId, messageText, currentDateString]);
  
        const newMessage = newMessageIns.rows[0];
  
        await db.query('UPDATE user_chats SET last_message_date = $1 WHERE id = $2;', [newMessage.time, chatId]);
  
        const userChatList = await db.query('SELECT id, contact_id, last_message_date FROM user_chats WHERE user_id = $1;', [claim.id]);
        const chatList = userChatList.rows.map(chat => {
          return {
            chatId: chat.id,
            contactId: chat.contact_id,
            lastMessageTime: chat.last_message_date.toISOString(),
          }
        });
  
        const resObj = {
          message: {
            who: newMessage.sender_id,
            message: newMessage.message,
            time: newMessage.time.toISOString(),
          },
          userChatList: chatList,
        };
  
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