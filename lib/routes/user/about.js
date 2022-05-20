const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/about', async (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      
      const resObj = {
        general: {},
        work: {},
        contact: {},
        groups: [],
        friends: [],
      };

      const generalInfo = await db.query('SELECT gender, birthday, about, location, occupation, skills FROM users_info WHERE user_id = $1;', [claim.id]);
      const info = generalInfo.rows[0];
      
      const generalObj = {
        gender: info.gender,
        birthday: info.birthday,
        locations: [info.location],
        about: info.about
      }

      const workObj = {
        occupation: info.occupation,
        skills: info.skills,
      }

      resObj.general = generalObj;
      resObj.work = workObj;

      const userContact = await db.query(`
        SELECT users.email as email, address, phone
        FROM users_info JOIN users ON users.id = user_id
        WHERE user_id = $1;
      `, [claim.id]);
      const contactInfo = userContact.rows[0];
      const contactObj = {
        address: contactInfo.address,
        tel: [contactInfo.phone],
        websites: [],
        emails: [contactInfo.email]
      };

      resObj.contact = contactObj;

      res.json(resObj);

    } else {
      res.sendStatus(403);
    }

  });

  router.post('/update/general', (req, res) => {
    const { firstName, lastName, about, birthday, gender, locations } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query(`
        UPDATE users_info
        SET about = $1,
            birthday = $2,
            gender = $3,
            location = $4
        WHERE user_id = $5;
      `, [about, birthday, gender, locations[0], claim.id])
        .then(() => {
          db.query('UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3;', [firstName, lastName, claim.id])
            .then(() => {
              res.sendStatus(200);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    } else {
      res.sendStatus(403);
    }

  });

  router.post('/update/work', (req, res) => {
    const { occupation, skills } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('UPDATE users_info SET occupation = $1, skills = $2 WHERE user_id = $3;', [occupation, skills, claim.id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));
    } else {
      res.sendStatus(403);
    };

  });

  router.post('/update/contact', (req, res) => {
    const { address, emails, tel } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('UPDATE users_info SET address = $1, phone = $2 WHERE user_id = $3;', [address, tel[0], claim.id])
        .then(() => {
          db.query('UPDATE users SET email = $1 WHERE id = $2;', [emails[0], claim.id])
            .then(() => {
              res.sendStatus(200);
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    } else {
      res.sendStatus(403);
    };

  });

  return router;

}