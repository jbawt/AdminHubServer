const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/notes', (req, res) => {

    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      
      db.query('SELECT * FROM notes WHERE user_id = $1;', [claim.id])
        .then(data => {

          Promise.all(data.rows.map(async (note) => {

            const checkList = await db.query('SELECT * FROM check_list_items WHERE note_id = $1', [note.id]);

            if (checkList.rows !== undefined) {
              note.checklist = checkList.rows;
            }

            const labels = await db.query('SELECT note_label_id FROM note_labels_xref WHERE note_id = $1', [note.id]);

            if (labels.rows !== undefined) {
              const labelIds = labels.rows.map(label => label.note_label_id);
              note.labels = labelIds;
            }

            return note;

          }))
          .then(() => {
            res.json(data.rows);
          })
          .catch(err => console.log(err));

        })
        .catch(err => console.log(err));

    };

  });

  router.post('/create-note', (req, res) => {

    const { title, description, archive, image, time, reminder, checklist, labels } = req.body.note;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const reminderUpdate = new Date(reminder);

    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('INSERT INTO notes (user_id, title, description, archive, image, time, reminder) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;', [claim.id, title, description, archive, image, time, reminderUpdate])
        .then(data => {

          const note = data.rows[0];

          const resObj = {
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            description: note.description,
            archive: note.archive,
            image: note.image,
            time: note.time,
            reminder: note.reminder,
            checklist: [],
            labels: [],
          };

          if (checklist.length !== 0 && labels.length !== 0) {

            Promise.all(checklist.map(async (item) => {
  
              const checkList = await db.query('INSERT INTO check_list_items (note_id, text, checked) VALUES ($1, $2, $3) RETURNING *;', [note.id, item.text, item.checked]);

              resObj.checklist = [...resObj.checklist, ...checkList.rows];
  
            }))
            .then(() => {
              
              Promise.all(labels.map(async (labelId) => {

                const label = await db.query('INSERT INTO note_labels_xref (note_id, note_label_id) VALUES ($1, $2) RETURNING *;', [note.id, labelId]);

                resObj.labels.push(label.rows[0].note_label_id);

              }))
              .then(() => {
                res.json(resObj);
              })
              .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

          } else if (checklist.length !== 0 && labels.length === 0) {

            Promise.all(checklist.map(async (item) => {

              const checkList = await db.query('INSERT INTO check_list_items (note_id, text, checked) VALUES ($1, $2, $3) RETURNING *;', [note.id, item.text, item.checked]);

              resObj.checklist = [...resObj.checklist, ...checkList.rows];

            }))
            .then(() => {
              res.json(resObj);
            })
            .catch(err => console.log(err));

          } else if (checklist.length === 0 && labels.length !== 0) {

            Promise.all(labels.map(async (labelId) => {

              const label = await db.query('INSERT INTO note_labels_xref (note_id, note_label_id) VALUES ($1, $2) RETURNING *;', [note.id, labelId]);

              resObj.labels.push(label.rows[0].note_label_id);

            }))
            .then(() => {
              res.json(resObj);
            })
            .catch(err => console.log(err));

          }

        })
        .catch(err => console.log(err));

    };

    
    
  });
  

  router.post('/update-note', (req, res) => {

    const { id, title, description, archive, image, time, reminder, checklist, labels } = req.body.note;

    db.query(`
      UPDATE notes 
      SET title = $1,
          description = $2,
          archive = $3,
          image = $4,
          time = $5,
          reminder = $6
      WHERE id = $7
      RETURNING *;
    `, [title, description, archive, image, time, reminder, id])
      .then(data => {
        const note = data.rows[0];

        const resObj = {
          id: note.id,
          user_id: note.user_id,
          title: note.title,
          description: note.description,
          archive: note.archive,
          image: note.image,
          time: note.time,
          reminder: note.reminder,
          checklist: [],
          labels: [],
        };

        db.query('DELETE FROM check_list_items WHERE note_id = $1', [note.id])
          .then(() => {

            db.query('DELETE FROM note_labels_xref WHERE note_id = $1', [note.id])
              .then(() => {

                if (checklist.length !== 0 && labels.length !== 0) {

                  Promise.all(checklist.map(async (item) => {
        
                    const checkList = await db.query('INSERT INTO check_list_items (note_id, text, checked) VALUES ($1, $2, $3) RETURNING *;', [note.id, item.text, item.checked]);
        
                    resObj.checklist = [...resObj.checklist, ...checkList.rows];
        
                  }))
                  .then(() => {
                    
                    Promise.all(labels.map(async (labelId) => {
        
                      const label = await db.query('INSERT INTO note_labels_xref (note_id, note_label_id) VALUES ($1, $2) RETURNING *;', [note.id, labelId]);
        
                      resObj.labels.push(label.rows[0].note_label_id);
        
                    }))
                    .then(() => {
                      res.json(resObj);
                    })
                    .catch(err => console.log(err));
        
                  })
                  .catch(err => console.log(err));
        
                } else if (checklist.length !== 0 && labels.length === 0) {
        
                  Promise.all(checklist.map(async (item) => {
        
                    const checkList = await db.query('INSERT INTO check_list_items (note_id, text, checked) VALUES ($1, $2, $3) RETURNING *;', [note.id, item.text, item.checked]);
        
                    resObj.checklist = [...resObj.checklist, ...checkList.rows];
        
                  }))
                  .then(() => {
                    res.json(resObj);
                  })
                  .catch(err => console.log(err));
        
                } else if (checklist.length === 0 && labels.length !== 0) {
        
                  Promise.all(labels.map(async (labelId) => {
        
                    const label = await db.query('INSERT INTO note_labels_xref (note_id, note_label_id) VALUES ($1, $2) RETURNING *;', [note.id, labelId]);
        
                    resObj.labels.push(label.rows[0].note_label_id);
        
                  }))
                  .then(() => {
                    res.json(resObj);
                  })
                  .catch(err => console.log(err));
        
                }

              })
              .catch(err => console.log(err));

          })
          .catch(err => console.log(err));

      })

  });


  router.post('/remove-note', (req, res) => {

    const { noteId } = req.body;

    db.query('DELETE FROM check_list_items WHERE note_id = $1;', [noteId]);
    db.query('DELETE FROM note_labels_xref WHERE note_id = $1;', [noteId]);
    db.query('DELETE FROM notes WHERE id = $1', [noteId])
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => console.log(err));

  });


  return router;

}