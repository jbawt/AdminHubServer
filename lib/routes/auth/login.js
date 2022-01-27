const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/', (req, res) => {

    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = $1', [email])
      .then(data => {
        if (data.rows[0].password === password) {

          const token = jwt.sign(data.rows[0].id, process.env.SECRET_KEY);

          const resObj = {
            user: {
              role: data.rows[0].role,
              data: {
                displayName: `${data.rows[0].first_name} ${data.rows[0].last_name}`,
                photoURL: '',
                email: data.rows[0].email,
                settings: {
                  layout: {
                    style: 'layout1',
                    config: {
                      scroll: 'content',
                      navbar: {
                        display: true,
                        folded: true,
                        position: 'left'
                      },
                      toolbar: {
                        display: true,
                        style: 'fixed',
                        position: 'below'
                      },
                      footer: {
                        display: true,
                        style: 'fixed',
                        position: 'below'
                      },
                      mode: 'fullwidth'
                    }
                  },
                  customScrollbars: true,
                  theme: {
                    main: 'defaultDark',
                    navbar: 'defaultDark',
                    toolbar: 'defaultDark',
                    footer: 'defaultDark'
                  },
                  loginRedirectUrl: 'apps/notes'
                },
                shortcuts: ['calendar', 'mail', 'contacts']
              },
            },
          }

          res.json(resObj);

        } else {
          res.status(403).send('Incorrect Password');
        }
      })
      .catch(err => console.log(err));

  });

  return router;

}