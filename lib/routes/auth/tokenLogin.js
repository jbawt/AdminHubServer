const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/', (req, res) => {

    const token = req.body.access_token;

    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {

      const claim = jwt.decode(token);
      const email = claim.email;

      db.query('SELECT * FROM users WHERE email = $1', [email])
      .then(data => {
        
        const claim = {
          email: data.rows[0].email,
          role: data.rows[0].role,
          id: data.rows[0].id
        }

        const token = jwt.sign(claim, process.env.SECRET_KEY);

        const resObj = {
          access_token: token,
          user: {
            role: data.rows[0].role,
            data: {
              displayName: `${data.rows[0].first_name} ${data.rows[0].last_name}`,
              photoURL: data.rows[0].photourl,
              email: data.rows[0].email,
              shortcuts: ['calendar', 'mail', 'contacts']
            },
          },
        }

        const dataObj = {resObj, user_id: data.rows[0].id}; 

        return dataObj;

      })
      .then(dataObj => {

        const { resObj, user_id } = dataObj;

        db.query('SELECT * FROM settings WHERE user_id = $1', [user_id])
          .then(data => {

            const themeId = data.rows[0].theme_id;
            const layoutId = data.rows[0].layout_id;

            const settings = {
              customScrollbars: data.rows[0].customscrollbars,
              direction: data.rows[0].direction,
              loginRedirectUrl: data.rows[0].loginredirecturl,
            };

            db.query('SELECT * FROM themes WHERE id = $1', [themeId])
              .then(data => {
                settings.theme = data.rows[0];
                delete settings.theme.id
              })
              .then(() => {

                db.query('SELECT * FROM layouts WHERE id = $1', [layoutId])
                  .then(data => {

                    const configId = data.rows[0].config_id;
                    const layout = {
                      style: data.rows[0].style
                    }

                    db.query('SELECT * FROM configs WHERE id = $1', [configId])
                      .then(data => {

                        const navbarId = data.rows[0].navbar_id;
                        const toolbarId = data.rows[0].toolbar_id;
                        const footerId = data.rows[0].footer_id

                        const config = {
                          scroll: data.rows[0].scroll,
                          mode: data.rows[0].mode,
                          containerWidth: data.rows[0].containerwidth,
                          leftPanelDisplay: data.rows[0].leftpaneldisplay,
                          rightPanelDisplay: data.rows[0].rightpaneldisplay
                        }
                        
                        db.query('SELECT * FROM footer WHERE id = $1', [footerId])
                          .then(data => {
                            config.footer = data.rows[0];
                            delete config.footer.id;
                          })
                          .then(() => {
                            db.query('SELECT * FROM navbar WHERE id = $1', [navbarId])
                              .then(data => {
                                config.navbar = data.rows[0];
                                delete config.navbar.id;
                              })
                              .then(() => {
                                db.query('SELECT * FROM toolbar WHERE id = $1', [toolbarId])
                                  .then(data => {
                                    config.toolbar = data.rows[0];
                                    delete config.toolbar.id;
                                  })
                                  .then(() => {
                                    layout.config = config;
                                  })
                                  .then(() => {
                                    settings.layout = layout;
                                  })
                                  .then(() => {
                                    resObj.user.data.settings = settings;
                                    res.json(resObj);
                                  })
                                  .catch(err => console.log(err));
                              })
                              .catch(err => console.log(err));
                          })
                          .catch(err => console.log(err));

                      })
                      .catch(err => console.log(err));

                  })
                  .catch(err => console.log(err));

              })
              .catch(err => console.log(err));
              
          })
          .catch(err => console.log(err));

      })
      .catch(err => console.log(err));

    }

  });

  return router;

}