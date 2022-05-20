const router = require('express').Router();
const axios = require('axios');
require('dotenv').config();

module.exports = (db) => {

  router.get('/auth', (req, res) => {
    const { code } = req.query;

    axios.post('https://github.com/login/oauth/access_token', null, { params: {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }})
    .then(response => {
      const gitToken = response.data.split('&')[0].split('=')[1];
      axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${gitToken}`
        }
      })
      .then(response => {
        const data = response.data;

        db.query('UPDATE users SET github_token = $1 WHERE email = $2;', [gitToken, data.email])
          .then(() => {
            res.redirect('http://localhost:3000/apps/dashboards/project');
          })
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));

  });

  return router;

}