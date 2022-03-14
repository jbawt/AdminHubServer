const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/user', async (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      const userInfo = await db.query('SELECT id, user_guid, first_name, last_name, photourl FROM users WHERE id = $1;', [claim.id]);
      const user = userInfo.rows[0];

      const resObj = {
        id: user.user_guid,
        name: `${user.first_name} ${user.last_name}`,
        avatar: user.photourl,
        starred: [],
        frequentContacts: [],
        groups: [],
      };

      const starredContacts = await db.query('SELECT contact_id FROM starredContacts WHERE user_id = $1;', [claim.id]);
      const starredContactIds = await Promise.all(starredContacts.rows.map(async (id) => {

        const guid = await db.query('SELECT user_guid FROM users WHERE id = $1;', [id.contact_id]);

        return guid.rows[0].user_guid;

      }))
      .catch(err => console.log(err));
      
      resObj.starred = starredContactIds;

      res.json(resObj);

    } else {
      res.sendStatus(403);
    }

  });
  
  router.get('/contacts', async (req, res) => {

    const { id } = req.query;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      switch (id) {
        case 'starred': {
          const contactId = await db.query('SELECT contact_id FROM starredContacts WHERE user_id = $1;', [claim.id]);
          const contacts = await Promise.all(contactId.rows.map(async (id) => {

            const contactInfo = await db.query('SELECT * FROM users WHERE id = $1;', [id.contact_id]);

            return contactInfo.rows[0];

          }))
          .catch(err => console.log(err));

          const resObj = contacts.map(contact => {
            if (contact.id === claim.id) {
              return null;
            } else {
              return {
                id: contact.user_guid,
                name: contact.first_name,
                lastName: contact.last_name,
                avatar: contact.photourl,
                nickname: contact.nickname,
                company: contact.company,
                jobTitle: contact.job_title,
                email: contact.email,
                phone: contact.phone,
                address: contact.address,
                birthday: contact.birthday === null ? '' : contact.birthday,
                notes: contact.notes
              }
            }
          });

          res.json(resObj.filter(obj => obj !== null));
          break;
        }
        default: {
          const contacts = await db.query('SELECT * FROM users;');
          const resObj = contacts.rows.map(contact => {
            if (contact.id === claim.id) {
              return null;
            } else {
              return {
                id: contact.user_guid,
                name: contact.first_name,
                lastName: contact.last_name,
                avatar: contact.photourl,
                nickname: contact.nickname,
                company: contact.company,
                jobTitle: contact.job_title,
                email: contact.email,
                phone: contact.phone,
                address: contact.address,
                birthday: contact.birthday === null ? '' : contact.birthday,
                notes: contact.notes
              }
            }
          });
          res.json(resObj.filter(obj => obj !== null));
        };
      }
    } else {
      res.sendStatus(403);
    }


  });

  router.post('/toggle-starred-contact', async (req, res) => {

    const { contactId } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const userId = await db.query('SELECT id FROM users WHERE id = $1;', [claim.id]);
      const contact = await db.query('SELECT id FROM users WHERE user_guid = $1', [contactId]);
      const contactID = contact.rows[0].id;
      const userID = userId.rows[0].id;

      const starredContacts = await db.query('SELECT * FROM starredContacts WHERE user_id = $1;', [userID]);
      const currentStarredIds = starredContacts.rows.map(contact => contact.contact_id);
      if (currentStarredIds.includes(contactID)) {
        await db.query('DELETE FROM starredContacts WHERE contact_id = $1 AND user_id = $2;', [contactID, claim.id]);
        res.sendStatus(200);
      } else {
        await db.query('INSERT INTO starredContacts (user_id, contact_id) VALUES ($1, $2);', [userID, contactID]);
        res.sendStatus(200);
      }

    } else {
      res.json(403);
    };

  });

  router.post('/set-contacts-starred', async (req, res) => {
    const { contactIds } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const currentIds = await db.query('SELECT contact_id FROM starredContacts WHERE user_id = $1;', [claim.id]).then(data => data.rows.map(contact => contact.contact_id));
      const newIds = await Promise.all(contactIds.map(async (contactId) => {

        const id = await db.query('SELECT id FROM users WHERE user_guid = $1;', [contactId]);

        return id.rows[0].id;

      }))
      .catch(err => console.log(err));
      
      Promise.all(newIds.map(async (id) => {

        if (!currentIds.includes(id)) {
          await db.query('INSERT INTO starredContacts (user_id, contact_id) VALUES ($1, $2);', [claim.id, id]);    
        };

      }))
      .then(() => res.sendStatus(200))
      .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    };
  });

  router.post('/set-contacts-unstarred', async (req, res) => {
    const { contactIds } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const numericIds = await Promise.all(contactIds.map(async (contactId) => {

        const id = await db.query('SELECT id FROM users WHERE user_guid = $1;', [contactId]);

        return id.rows[0].id;

      }))
      .catch(err => console.log(err));

      Promise.all(numericIds.map(async (id) => {

        await db.query('DELETE FROM starredContacts WHERE contact_id = $1 AND user_id = $2;', [id, claim.id]);

      }))
      .then(() => res.sendStatus(200))
      .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  return router;

}