const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/boards', async (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('SELECT board_id FROM board_members WHERE user_id = $1;', [claim.id])
        .then(async data => {

          const boards = await Promise.all(data.rows.map(async (board) => {

            const boardData = await db.query('SELECT * FROM boards WHERE id = $1;', [board.board_id])

            return {
              id: board.board_id,
              name: boardData.rows[0].name,
              uri: boardData.rows[0].uri
            }

          }))
          .catch(err => console.log(err));

          res.json(boards);

        })
        .catch(err => console.log(err));

    };

  });

  router.get('/board', async (req, res) => {

    const { boardId, boardUri } = req.query;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const claim = jwt.decode(token);
  

        const boardInfo = await db.query('SELECT * FROM boards WHERE id = $1;', [boardId])

        const boardObj = {
          id: boardInfo.rows[0].id,
          name: boardInfo.rows[0].name,
          uri: boardInfo.rows[0].uri
        };
        
        // USERS FOR ADMIN PURPOSES
        if (claim.role === 'admin') {
          const usersQuery = await db.query('SELECT users.id as id, users.first_name, users.last_name, users.photourl as avatar FROM users;');
          const users = usersQuery.rows.map(user => {
            return {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              avatar: user.avatar
            };
          });
          boardObj.users = users;
        }

        // SETTINGS
        const settingsInfo = await db.query('SELECT * FROM board_settings WHERE board_id = $1;', [boardId])
        const subscribed = await db.query('SELECT subscribed FROM board_members WHERE user_id = $1 AND board_id = $2;', [claim.id, boardId]);
        boardObj.settings = {
          color: settingsInfo.rows[0].color,
          subscribed: subscribed.rows[0].subscribed,
          cardCoverImages: settingsInfo.rows[0].card_cover_images
        }

        // LABELS
        const boardLabels = await db.query('SELECT * FROM board_labels WHERE board_id = $1;', [boardId]);
        const labels = boardLabels.rows.map(label => {
          return {
            id: label.id,
            name: label.name,
            class: label.class
          }
        });
        boardObj.labels = labels;

        // MEMBERS
        const boardMembers = await db.query(`
        SELECT users.id as id, users.first_name, users.last_name, users.photourl as avatar
        FROM users JOIN board_members ON users.id = board_members.user_id
        WHERE board_members.board_id = $1;
        `, [boardId])

        const members = boardMembers.rows.map(member => {
          return {
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            avatar: member.avatar
          }
        });
        boardObj.members = members;

        // LISTS
        const boardLists = await db.query('SELECT id, name, list_order, draggable_id FROM lists WHERE board_id = $1 ORDER BY list_order;', [boardId]);
        const lists = await Promise.all(boardLists.rows.map(async (list) => {
          
          const data = {
            id: list.id,
            draggableId: list.draggable_id,
            name: list.name,
            idCards: [],
            draggableCardIds: [],
            list_order: list.list_order,
          };

          const id = await db.query('SELECT id FROM cards WHERE list_id = $1 ORDER BY card_order;', [list.id])

          id.rows.map(id => {
            if (id.id !== undefined) {
              data.idCards = [...data.idCards, id.id]
            }
          });

          const draggableIds = await db.query('SELECT draggable_id FROM cards WHERE list_id = $1 ORDER BY card_order;', [list.id]);

          draggableIds.rows.map(draggableId => {
            if (draggableId.draggable_id !== undefined) {
              data.draggableCardIds = [...data.draggableCardIds, draggableId.draggable_id];
            };
          });

          return data;

        }))
        .catch(err => console.log(err));

        boardObj.lists = lists;

        // CARDS
        const boardCards = await db.query(`
            SELECT cards.id, cards.name, cards.description, cards.id_attachment_cover, cards.subscribed, cards.due, cards.draggable_id 
            FROM cards JOIN lists ON lists.id = cards.list_id 
            WHERE lists.board_id = $1;
        `, [boardId]);
        const cards = await Promise.all(boardCards.rows.map(async (card) => {

          const subscribedQuery = await db.query('SELECT card_members.subscribed FROM card_members JOIN board_members ON board_member_id = board_members.id WHERE card_id = $1 AND board_members.user_id = $2;', [card.id, claim.id])
          const subscribed = subscribedQuery.rows.length > 0 ? subscribedQuery.rows[0].subscribed : false;

          const data = {
            id: card.id,
            draggableId: card.draggable_id,
            name: card.name,
            description: card.description,
            idAttachmentCover: card.id_attachment_cover === null ? '' : card.id_attachment_cover,
            idMembers: [],
            idLabels: [],
            attachments: [],
            subscribed: subscribed,
            checklists: [],
            activities: [],
            due: card.due
          };

          const members = await db.query(`
            SELECT board_members.user_id 
            FROM card_members
            JOIN board_members ON board_member_id = board_members.id 
            WHERE card_members.card_id = $1;
          `, [card.id])
          members.rows.map(member => {
            if (member.user_id !== undefined) {
              data.idMembers = [...data.idMembers, member.user_id];
            };
          });

          const labels = await db.query('SELECT board_label_id FROM card_labels_xref WHERE card_id = $1;', [card.id]);
          labels.rows.map(label => {
            if (label.board_label_id !== undefined) {
              data.idLabels = [...data.idLabels, label.board_label_id];
            };
          });

          const attachments = await db.query('SELECT id, name, src, time, type, attachment_id FROM attachments WHERE card_id = $1;', [card.id]);
          attachments?.rows?.map(attachment => {
            if (attachment !== undefined) {
              data.attachments = [...data.attachments, attachment];
            };
          });

          const activities = await db.query('SELECT id, type, member_id, message, time, activity_id FROM activities WHERE card_id = $1;', [card.id]);
          activities.rows.map(activity => {
            if (activities !== undefined) {
              activity.idMember = activity.member_id;
              data.activities = [...data.activities, activity];
            };
          });

          const cardCheckLists = await db.query('SELECT id, name, checklist_id FROM card_checklists WHERE card_id = $1', [card.id]);
          const checklists = await Promise.all(cardCheckLists.rows.map(async (checklist) => {
            const updatedCheckList = {
              id: checklist.id,
              name: checklist.name,
              checklist_id: checklist.checklist_id,
              checkItems: []
            };

            const checkListItems = await db.query('SELECT id, name, checked, checklist_item_id FROM card_checklist_items WHERE card_checklist_id = $1;', [checklist.id])
            checkListItems.rows.map(item => {
              if (item !== undefined) {
                updatedCheckList.checkItems = [...updatedCheckList.checkItems, item];
              };
            });

            return updatedCheckList;
          }))
          .catch(err => console.log(err));
          data.checklists = checklists;

          return data;

        }))
        .catch(err => console.log(err));

        boardObj.cards = cards;

        res.json(boardObj);

  })

  router.post('/board/new', async (req, res) => {

    const { name, uri, settings, lists, cards, members, labels } = req.body.board;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      const boardData = await db.query('INSERT INTO boards (name, uri) VALUES ($1, $2) RETURNING *;', [name, uri])
        
        const resObj = {
          id: boardData.rows[0].id,
          name: boardData.rows[0].name,
          uri: boardData.rows[0].uri
        };

        // USERS FOR ADMIN PURPOSES
        if (claim.role === 'admin') {
          const usersQuery = await db.query('SELECT users.id as id, users.first_name, users.last_name, users.photourl as avatar FROM users;');
          const users = usersQuery.rows.map(user => {
            return {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              avatar: user.avatar
            };
          });
          resObj.users = users;
        } 

          db.query('INSERT INTO board_settings (board_id, color, card_cover_images) VALUES ($1, $2, $3) RETURNING *;', [resObj.id, settings.color, settings.cardCoverImages])
            .then(data => {
              resObj.settings = data.rows[0];
            })
            .then(() => {
              db.query('INSERT INTO board_members (user_id, board_id, subscribed) VALUES ($1, $2, $3);', [claim.id, resObj.id, settings.subscribed])
                .then(() => {
                  db.query('SELECT id, first_name, last_name, photourl as avatar FROM users WHERE id = $1;', [claim.id])
                    .then(data => {
                      const member = {
                        id: data.rows[0].id,
                        name: `${data.rows[0].first_name} ${data.rows[0].last_name}`,
                        avatar: data.rows[0].avatar
                      }
                      resObj.members = [member];
                      res.json(resObj);
                    })
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));

    }

  });

  router.post('/board/delete', (req, res) => {

    const { boardId } = req.body;

    db.query('DELETE FROM boards WHERE id = $1;', [boardId])
      .then(() => {
        db.query('DELETE FROM board_members WHERE board_id = $1;', [boardId])
          .then(() => {
            res.sendStatus(200);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));

  });

  router.post('/board/rename', (req, res) => {

    const { boardId, boardTitle } = req.body;
    const newUri = boardTitle.toLowerCase().replace(" ", "-");

    db.query('UPDATE boards SET name = $1, uri = $2 WHERE id = $3 RETURNING *;', [boardTitle, newUri, boardId])
      .then((data) => {
        res.json(data.rows[0].name);
      })
      .catch(err => console.log(err));

  });

  return router;

};