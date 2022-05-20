const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

module.exports = (db) => {

  router.get('/projects', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);
      const gitToken = await db.query('SELECT github_token FROM users WHERE id = $1;', [claim.id])
		  const gitAccessToken = gitToken.rows[0].github_token;

      if (gitAccessToken !== null) {

        const gitRepos = await axios.get(`${process.env.GITHUB_API_URL}/user/repos`, {
          headers: {
            Access: 'application/vnd.github.v3+json',
            Authorization: `token ${gitAccessToken}`
          }
        });

        const repoList = gitRepos.data.map(repo => {
          return {
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
          }
        })
        
        res.json(repoList);

      }

      // db.query(`
      //   SELECT boards.id, boards.name
      //   FROM boards
      //   JOIN board_members ON boards.id = board_members.board_id
      //   JOIN board_settings ON boards.id = board_settings.board_id
      //   WHERE board_members.user_id = $1
      //   AND board_members.subscribed = $2;
      // `, [claim.id, true])
      //   .then(data => {
      //     res.json(data.rows);
      //   })
      //   .catch(err => console.log(err));

    } else {
      res.sendStatus(403);
    }

  });

  return router;

}