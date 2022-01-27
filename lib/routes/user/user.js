const router = require('express').Router();

module.exports = (db) => {

  router.post('/update', (req, res) => {

    const {user} = req.body;
    const {customScrollbars, direction, loginRedirectUrl, theme, layout} = user.data.settings;
    const { style, config } = layout;
    const { scroll, mode, containerWidth, leftPanelDisplay, rightPanelDisplay, footer, navbar, toolbar } = config;

    // console.log("footer: ", footer);
    // console.log("navbar: ", navbar);
    // console.log("toolbar: ", toolbar);

    db.query('SELECT id FROM users WHERE email = $1', [user.data.email])
      .then(data => {
        const userId = data.rows[0].id;
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

  return router;

}