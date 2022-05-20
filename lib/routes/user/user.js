const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/update', (req, res) => {

    const { user } = req.body;
    const shortcuts = user.data.shortcuts;
    const { customScrollbars, direction, loginRedirectUrl, theme, layout } = user.data.settings;
    const { style, config } = layout;
    const { scroll, mode, containerWidth, leftPanelDisplay, rightPanelDisplay, footer, navbar, toolbar } = config;

    db.query('SELECT id FROM users WHERE email = $1', [user.data.email])
      .then(data => {
        const userId = data.rows[0].id;

        db.query('DELETE FROM shortcuts WHERE user_id = $1', [userId])
          .then(() => {
            
            Promise.all(shortcuts.map(async shortcut => {

              await db.query('INSERT INTO shortcuts (user_id, title) VALUES ($1, $2)', [userId, shortcut])

            }))
            .catch(err => console.log(err));
          
          })

        db.query('UPDATE settings SET customscrollbars = $1, direction = $2, loginredirecturl = $3 WHERE user_id = $4 RETURNING *;', [customScrollbars, direction, loginRedirectUrl, userId])
          .then(data => {
            const layoutId = data.rows[0].layout_id;
            const themeId = data.rows[0].theme_id;

            db.query('UPDATE themes SET main = $1, navbar = $2, toolbar = $3, footer = $4 WHERE id = $5 RETURNING *;', [theme.main, theme.navbar, theme.toolbar, theme.footer, themeId])
              .catch(err => console.log(err));

            db.query('UPDATE layouts SET style = $1 WHERE id = $2 RETURNING *;', [style, layoutId])
              .then(data => {
                const configId = data.rows[0].config_id;

                db.query('UPDATE configs SET scroll = $1, mode = $2, containerwidth = $3, leftpaneldisplay = $4, rightpaneldisplay = $5 WHERE id = $6 RETURNING *;', [scroll, mode, containerWidth, leftPanelDisplay, rightPanelDisplay, configId])
                  .then(data => {
                    const navbarId = data.rows[0].navbar_id;
                    const toolbarId = data.rows[0].toolbar_id;
                    const footerId = data.rows[0].footer_id;

                    db.query('UPDATE navbar SET display = $1, folded = $2, position = $3, style = $4 WHERE id = $5 RETURNING *;', [navbar.display, navbar.folded, navbar.position, navbar.style, navbarId])
                      .catch(err => console.log(err));

                    db.query('UPDATE toolbar SET display = $1, style = $2, position = $3 WHERE id = $4 RETURNING *;', [toolbar.display, toolbar.style, toolbar.position, toolbarId])
                      .catch(err => console.log(err));

                    db.query('UPDATE footer SET display = $1, style = $2, position = $3 WHERE id = $4 RETURNING *;', [footer.display, footer.style, footer.position, footerId])
                      .catch(err => console.log(err));

                  })
                  .catch(err => console.log(err));
                
              })
              .catch(err => console.log(err));

          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));

  });

  router.post('/reset-password', (req, res) => {
    const { password } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const hashedPass = bcrypt.hashSync(password, 10);

      db.query('UPDATE users SET password = $1 WHERE id = $2;', [hashedPass, claim.id])
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    };

  });

  router.get('/user-info', (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query(`
        SELECT first_name, last_name, email, photourl, settings.loginredirecturl
        FROM users JOIN settings ON users.id = settings.user_id
        WHERE users.id = $1;
      `, [claim.id])
        .then(data => {
          res.json(data.rows[0]);
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }
  });

  router.post('/update-info', (req, res) => {
    const { firstName, lastName, email, photoUrl, homePage } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      db.query('UPDATE users SET first_name = $1, last_name = $2, email = $3, photourl = $4 WHERE id = $5;', [firstName, lastName, email, photoUrl, claim.id])
        .then(() => {
          db.query('UPDATE settings SET loginredirecturl = $1 WHERE user_id = $2;', [homePage, claim.id])
            .then(() => {
              res.json({
                displayName: `${firstName} ${lastName}`,
                email,
                photoUrl,
                homePage,
              });
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  })

  return router;

}