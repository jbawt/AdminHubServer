const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/boards', (req, res) => {

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
    console.log(boardId);

  

        const boardInfo = await db.query('SELECT * FROM boards WHERE id = $1;', [boardId])

        const boardObj = {
          id: boardInfo.rows[0].id,
          name: boardInfo.rows[0].name,
          uri: boardInfo.rows[0].uri
        }            

        // SETTINGS
        const settingsInfo = await db.query('SELECT * FROM board_settings WHERE board_id = $1;', [boardId])
        boardObj.settings = {
          color: settingsInfo.rows[0].color,
          subscribed: settingsInfo.rows[0].subscribed,
          cardCoverImage: settingsInfo.rows[0].card_cover_images
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
        const boardLists = await db.query('SELECT id, name FROM lists WHERE board_id = $1;', [boardId]);
        const lists = await Promise.all(boardLists.rows.map(async (list) => {
          
          const data = {
            id: list.id,
            name: list.name,
            idCards: [],
          }

          const id = await db.query('SELECT id FROM cards WHERE list_id = $1;', [list.id])

          id.rows.map(id => {
            if (id.id !== undefined) {
              data.idCards = [...data.idCards, id.id]
            }
          });

          return data;

        }))
        .catch(err => console.log(err));

        boardObj.lists = lists;

        // CARDS
        const boardCards = await db.query('SELECT id, name, description, id_attachment_cover, subscribed, due FROM cards;')
        const cards = await Promise.all(boardCards.rows.map(async (card) => {

          const data = {
            id: card.id,
            name: card.name,
            description: card.description,
            idAttachmentCover: card.id_attachment_cover,
            idMembers: [],
            idLabels: [],
            attachments: [],
            subscribed: card.subscribed,
            checklists: [],
            activities: [],
            due: card.due
          }

          const members = await db.query('SELECT user_id FROM board_members WHERE card_id = $1;', [card.id])
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

          const attachments = await db.query('SELECT id, name, src, time, type FROM attachments WHERE card_id = $1;', [card.id]);
          attachments.rows.map(attachment => {
            if (attachment !== undefined) {
              data.attachments = [...data.attachments, attachment];
            };
          });

          const activities = await db.query('SELECT id, type, member_id, message, time FROM activities WHERE card_id = $1;', [card.id]);
          activities.rows.map(activity => {
            if (activities !== undefined) {
              data.activities = [...data.activities, activity];
            };
          });

          const cardCheckLists = await db.query('SELECT id, name FROM card_checklists WHERE card_id = $1', [card.id]);
          const checklists = await Promise.all(cardCheckLists.rows.map(async (checklist) => {
            const updatedCheckList = {
              id: checklist.id,
              name: checklist.name,
              checkItems: []
            };

            const checkListItems = await db.query('SELECT id, name, checked FROM card_checklist_items WHERE card_checklist_id = $1;', [checklist.id])
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
        console.log(boardObj);
        res.json(boardObj);

  })

  // router.post('/board/new', (req, res) => {

  //   const { name, uri, id, settings, lists, cards, members, labels } = req.body.board;
  //   // console.log(members);
  //   // console.log(labels);

  // });

  return router;

};