const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/data', (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);

      db.query('SELECT id, title, description, time, reminder FROM notes WHERE user_id = $1 ORDER BY id DESC LIMIT 15;', [claim.id])
        .then(data => {

          const today = new Date();
          const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
          const filteredReminders = data.rows.filter(note => note.reminder !== null);
          const filteredNotes = data.rows.filter(note => note.reminder === null);

          const reminders = filteredReminders.map(note => {
            if (note.reminder >= today && note.reminder <= nextWeek) {

              const noteData = {
                id: note.id,
                title: note.title ? note.title : note.description,
                reminder: note.reminder
              }

              return noteData;
            } else {
              return null;
            }
          }).filter(data => data !== null);

          const notes = filteredNotes.map(note => {
            const noteData = {
              id: note.id,
              title: note.title ? note.title : '*Untitled*',
              description: note.description ? note.description: '',
            };

            return noteData

          });

          const resObj = {
            notes,
            reminders
          };

          return resObj

        })
        .then(resObj => {

          res.json(resObj);

        })
        .catch(err => console.log(err));

    };

  });

  return router;

}