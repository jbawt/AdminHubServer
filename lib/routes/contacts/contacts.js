const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/user', (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('SELECT id, first_name, last_name, photourl FROM users WHERE id = $1;', [claim.id])
        .then(data => {
          const userInfo = {
            id: data.rows[0].id,
            name: `${data.rows[0].first_name} ${data.rows[0].last_name}`,
            avatar: data.rows[0].photourl,
            starred: [],
            frequentContacts: [],
            groups: [],
          };

          return userInfo;
        })
        .then(userInfo => {
          db.query('SELECT id FROM contacts WHERE user_id = $1 AND starred = $2;', [userInfo.id, true])
            .then(data => {
              const starredContacts = data.rows.map(contactId => contactId.id);
              userInfo.starred = starredContacts;
              res.json(userInfo);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });
  
  router.get('/contacts', (req, res) => {

    const { id } = req.query;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      switch (id) {
        case 'starred': {
          db.query('SELECT * FROM contacts WHERE user_id = $1 AND starred = $2 ORDER BY last_name;', [claim.id, true])
            .then(data => {
              const resArr = data.rows.map(contact => {
                return {
                  id: contact.id,
                  name: contact.first_name,
                  lastName: contact.last_name,
                  avatar: '',
                  nickname: contact.nickname,
                  company: contact.company,
                  jobTitle: contact.job_title,
                  email: contact.email,
                  phone: contact.phone,
                  address: contact.address,
                  birthday: contact.birthday === null ? '' : contact.birthday,
                  notes: contact.notes
                };
              });
            
              res.json(resArr);
            })
            .catch(err => console.log(err));
          break;
        }
        default: {
          db.query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY last_name;', [claim.id])
            .then(data => {
              const resArr = data.rows.map(contact => {
                return {
                  id: contact.id,
                  name: contact.first_name,
                  lastName: contact.last_name,
                  avatar: '',
                  nickname: contact.nickname,
                  company: contact.company,
                  jobTitle: contact.job_title,
                  email: contact.email,
                  phone: contact.phone,
                  address: contact.address,
                  birthday: contact.birthday === null ? '' : contact.birthday,
                  notes: contact.notes
                };
              });
            
              res.json(resArr);
            })
            .catch(err => console.log(err));
        }
      };

    } else {
      res.sendStatus(403);
    };

  });

  router.post('/add-contact', (req, res) => {
    const { contact } = req.body;
    const { name, lastName, nickname, company, jobTitle, email, phone, address, birthday, notes } = contact;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      db.query(`
      INSERT INTO contacts (user_id, first_name, last_name, nickname, company, job_title, email, phone, address, birthday, notes, starred)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
    `, [claim.id, name, lastName, nickname, company, jobTitle, email, phone, address, birthday, notes, false])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  router.post('/remove-contact', (req, res) => {
    const { contactId } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2;', [contactId, claim.id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));
      
    } else {
      res.sendStatus(403);
    }
    
  });

  router.post('/remove-contacts', (req, res) => {
    const { contactIds } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      Promise.all(contactIds.map(async (id) => {

        await db.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2;', [id, claim.id]);

      }))
      .then(() => res.sendStatus(200))
      .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  router.post('/update-contact', (req, res) => {
    const { contact } = req.body;
    const { id, name, lastName, nickname, company, jobTitle, email, phone, address, birthday, notes } = contact;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      db.query(`
        UPDATE contacts
          SET first_name = $1,
              last_name = $2,
              nickname = $3,
              company = $4,
              job_title = $5,
              email = $6,
              phone = $7,
              address = $8,
              birthday = $9,
              notes = $10
        WHERE id = $11
        AND user_id = $12;
      `, [name, lastName, nickname, company, jobTitle, email, phone, address, birthday, notes, id, claim.id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  router.post('/toggle-starred-contact', (req, res) => {

    const { contactId } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      db.query('SELECT starred FROM contacts WHERE id = $1;', [contactId])
        .then(data => {
          const starred = data.rows[0].starred;
          db.query('UPDATE contacts SET starred = $1 WHERE id = $2 AND user_id = $3', [!starred, contactId, claim.id])
            .then(() => {
              res.sendStatus(200);
            })
            .catch(err => console.log(err));
        });
    } else {
      res.sendStatus(403);
    }

  });

  router.post('/set-contacts-starred', (req, res) => {

    const { contactIds } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      Promise.all(contactIds.map(async (id) => {

        await db.query('UPDATE contacts SET starred = $1 WHERE id = $2 AND user_id = $3;', [true, id, claim.id]);
  
      }))
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }
    
    
  });

  router.post('/set-contacts-unstarred', (req, res) => {

    const { contactIds } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(' ')[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      Promise.all(contactIds.map(async (id) => {

        await db.query('UPDATE contacts SET starred = $1 WHERE id = $2 AND user_id = $3;', [false, id, claim.id]);
  
      }))
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }
    
  });

  return router;

}