const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/board/settings/update', (req, res) => {

    const { boardId, settings } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const claim = jwt.decode(token);

    db.query('UPDATE board_settings SET color = $1, card_cover_images = $2 WHERE board_id = $3 RETURNING *;', [settings.color, settings.cardCoverImages, boardId])
      .then((data) => {
        const resObj = {
          color: data.rows[0].color,
          cardCoverImages: data.rows[0].card_cover_images
        }

        db.query('UPDATE board_members SET subscribed = $1 WHERE user_id = $2 AND board_id = $3 RETURNING *;', [settings.subscribed, claim.id, boardId])
          .then(data => {
            resObj.subscribed = data.rows[0].subscribed;
            res.json(resObj);
          })
          .catch(err => console.log(err));

      })
      .catch(err => console.log(err));

  });

  router.post('/board/update-members', async (req, res) => {

    const { newMembers, boardId } = req.body;

    const currentMembersQuery = await db.query(`
      SELECT users.id as id, users.first_name, users.last_name, users.photourl as avatar
      FROM users JOIN board_members ON users.id = board_members.user_id
      WHERE board_members.board_id = $1;
    `, [boardId]);
    const currentMembers = currentMembersQuery.rows.map(member => {
      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        avatar: member.avatar
      };
    });
    let newMemberList = [];

    if (currentMembers.length < newMembers.length) {
      let newMemberToAdd;

      const currentMemberIds = currentMembers.map(member => member.id);
      newMembers.map(member => {
        if (!currentMemberIds.includes(member.id)) {
          newMemberToAdd = member;
        }
        newMemberList.push(member);
      });

      await db.query('INSERT INTO board_members (user_id, board_id) VALUES ($1, $2);', [newMemberToAdd.id, boardId]);

      res.json(newMemberList);

    } else if (currentMembers.length > newMembers.length) {
      let memberToRemove;

      const newMemberIds = newMembers.map(member => member.id);
      currentMembers.map(member => {
        if (!newMemberIds.includes(member.id)) {
          memberToRemove = member;
        } else {
          newMemberList.push(member);
        };
      });

      await db.query('DELETE FROM board_members WHERE user_id = $1 AND board_id = $2;', [memberToRemove.id, boardId]);
      await db.query(`
        DELETE FROM card_members
        WHERE board_member_id IN (SELECT id FROM board_members WHERE user_id = $1);
      `, [memberToRemove.id]);

      res.json(newMemberList);

    }

  });

  router.post('/new-label', (req, res) => {
    const { title, color, boardId } = req.body;

    db.query('INSERT INTO board_labels (board_id, name, class) VALUES ($1, $2, $3);', [boardId, title, color])
      .then(() => {
        db.query('SELECT id, name, class FROM board_labels WHERE board_id = $1;', [boardId])
          .then(data => {
            res.json(data.rows);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  });

  router.post('/remove-label', (req, res) => {
    const { boardId, labelId } = req.body;

    db.query('DELETE FROM board_labels WHERE board_id = $1 AND id = $2;', [boardId, labelId])
      .then(() => {
        db.query('DELETE FROM card_labels_xref WHERE board_label_id = $1;', [labelId])
        .then(() => {
          res.json({ boardId, labelId });
        })
        .catch(err => console.log(err));  
      })
      .catch(err => console.log(err));
  });

  return router;

}