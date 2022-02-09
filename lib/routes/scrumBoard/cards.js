const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/card/new', async (req, res) => {

    const { boardId, listId, data } = req.body;

    try {

      await db.query('INSERT INTO cards (list_id, name, description, id_attachment_cover, subscribed, due) VALUES ($1, $2, $3, $4, $5, $6);', [listId, data.name, data.description, null, data.subscribed, null]);
      
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

        res.json(boardObj);

    } catch (error) {
      
      console.log(error);

    };

  });

  router.post('/card/remove', (req, res) => {

    const { boardId, cardId } = req.body;

    db.query('DELETE FROM cards WHERE id = $1;', [cardId])
      .then(() => {
        res.json(cardId);
      })
      .catch(err => console.log(err));

  });

  router.post('/card/update', async (req, res) => {

    const { boardId, card } = req.body;
    const { id, name, description, idAttachmentCover, idMembers, idLabels, attachments, subscribed, checklists, activities, due } = card;
    const attachmentId = idAttachmentCover === '' ? null : idAttachmentCover;
    const dueDate = due === '' ? null : due;

    const newCardInfo = await db.query(`
      UPDATE cards 
      SET name =$1,
          description = $2,
          id_attachment_cover =$3,
          subscribed = $4,
          due = $5
      WHERE id = $6
      RETURNING *;
    `, [name, description, attachmentId, subscribed, dueDate, id]);

    const cardData = newCardInfo.rows[0];

    const newCard = {
      id: cardData.id,
      name: cardData.name,
      description: cardData.description,
      idAttachmentCover: cardData.id_attachment_cover === null ? '' : cardData.id_attachment_cover,
      subscribed: cardData.subscribed,
      due: cardData.due === null ? '' : cardData.due,
      checklists,
      idMembers,
      attachments,
      activities
    };

    // MEMBERS
    // // const cardMembers = await db.query('SELECT * FROM board_members WHERE card_id = $1', [newCard.id]);
    // // const cardMemberIds = cardMembers.rows.map(member => member.user_id);
    // // console.log(cardMemberIds);
    // // const newCardMembers = await Promise.all(idMembers.map(async (id) => {

    // //   if (!cardMemberIds.includes(id)) {
    // //     await db.query('INSERT INTO board_members (board_id, user_id, card_id) VALUES ($1, $2, $3) RETURNING *;', [boardId, id, newCard.id]);
    // //   }

    // // }))
    // // .catch(err => console.log(err));

    // LABELS
    const currentLabelsQuery = await db.query('SELECT board_label_id FROM card_labels_xref WHERE card_id = $1;', [newCard.id]);
    const currentLabels = currentLabelsQuery.rows.map(label => label.board_label_id);
    const newLabelList = [];
    if (currentLabels > idLabels) {
      let labelToRemove;
      
      currentLabels.map(labelId => {
        if (!idLabels.includes(labelId)) {
          labelToRemove = labelId;
        } else {
          newLabelList.push(labelId);
        }
      });

      await db.query('DELETE FROM card_labels_xref WHERE board_label_id = $1;', [labelToRemove]);
      newCard.idLabels = newLabelList;

    } else if (currentLabels < idLabels) {
      let labelToAdd;
      
      idLabels.map(labelId => {
        if (!currentLabels.includes(labelId)) {
          labelToAdd = labelId;
        };
        newLabelList.push(labelId);
      });
      
      await db.query('INSERT INTO card_labels_xref (card_id, board_label_id) VALUES ($1, $2);', [newCard.id, labelToAdd]);
      newCard.idLabels = newLabelList;

    } else {
      newCard.idLabels = idLabels;
    };

    // ACTIVITIES
    const currentActivities = await db.query ('SELECT * FROM activities WHERE card_id = $1;', [newCard.id]);
    const activityIds = currentActivities.rows.map(activity => activity.activity_id);
    let newActivity = null;
    activities.map(activity => {
      if (!activityIds.includes(activity.activity_id)) {
        activity.time = new Date(activity.time);
        newActivity = activity;
        return;
      };
    });

    if (newActivity !== null) {
      await db.query(`
      INSERT INTO activities (card_id, type, member_id, message, time, activity_id) 
      VALUES ($1, $2, $3, $4, $5, $6);
      `, [newCard.id, newActivity.type, newActivity.idMember , newActivity.message, newActivity.time, newActivity.activity_id]);
    };

    // // ATTACHMENTS

    const currentAttachments = await db.query('SELECT * FROM attachments WHERE card_id = $1', [newCard.id]);
    const attachmentIds = currentAttachments.rows.map(attachment => attachment.attachment_id);
    let newAttachment = null;
    attachments.map(attachment => {
      if (!attachmentIds.includes(attachment.attachment_id)) {
        newAttachment = attachment;
        return;
      };
    });

    if (newAttachment !== null) {
      await db.query(`
        INSERT INTO attachments (card_id, name, src, time, type, attachment_id)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [newCard.id, newAttachment.name, newAttachment.src, newAttachment.time, newAttachment.type, newAttachment.attachment_id]);
    };

    // RETURN NEW CARD

    res.json(newCard);

  });

  // router.post('/card/remove-attachment', (req, res) => {

  //   const { attachmentId } = req.body;

  //   db.query('DELETE FROM attachments WHERE id = $1;', [attachmentId])
  //     .then(() => {
  //       res.json(attachmentId);
  //     })
  //     .catch(err => console.log(err));

  // });

  // router.post('/card/attachment-cover', async (req, res) => {

  //   const { attachmentId, cardId } = req.body;

  //   await db.query('UPDATE cards SET id_attachment_cover = $1 WHERE id = $2 RETURNING *;', [attachmentId, cardId])
  //     .catch(err => console.log(err));

  //   res.json(attachmentId);

  // });

  // router.post('/card/remove/attachment-cover', async (req, res) => {

  //   const { cardId } = req.body;

  //   await db.query('UPDATE cards SET id_attachment_cover = $1 WHERE id = $2 RETURNING *;', [null, cardId])
  //     .catch(err => console.log(err));

  //   res.sendStatus(200);

  // });

  return router;

}