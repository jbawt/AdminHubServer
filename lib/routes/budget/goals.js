const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.get('/goals', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    if (verified) {
      const claim = jwt.decode(token);

      try {
        const goalsQuery = `
          SELECT goals.id, name, description, savings_goal
          FROM goals
          JOIN goal_members ON goals.id = goal_members.goal_id
          WHERE user_id = $1;
        `;

        const goalInfo = await db.query(goalsQuery, [claim.id]);

        const goalInfoWithMemsAndAmount = await Promise.all(goalInfo.rows.map(async (goal) => {
          const goalMembersQuery = `
            SELECT users.id, first_name, last_name, photourl
            FROM users JOIN goal_members ON users.id = goal_members.user_id
            WHERE goal_members.goal_id = $1;
          `;
          const savedAmountQuery = `
            SELECT sum(amount) as amount
            FROM weekly_savings
            WHERE goal_id = $1;
          `;
          const userQuery = `
            SELECT id, first_name, last_name, photourl FROM users;
          `;

          const memberInfo = await db.query(goalMembersQuery, [goal.id]);
          const savingsInfo = await db.query(savedAmountQuery, [goal.id]);
          const usersInfo = await db.query(userQuery);
          const memberIds = memberInfo.rows.map(member => member.id);

          goal.members = memberInfo.rows;
          goal.amountSaved = Number(savingsInfo.rows[0].amount)
          goal.users = usersInfo.rows;
          goal.memberIds = memberIds;

          return goal;
        }));

        res.json(goalInfoWithMemsAndAmount); 
      } catch (error) {
        console.log(error);
      }

    } else {
      res.sendStatus(403);
    }
  });

  router.get('/goal', async (req, res) => {
    const { goalId } = req.query;

    try {
      const goalQuery = `
        SELECT * FROM goals WHERE id = $1;
      `;
      const weeklySavingsQuery = `
        SELECT week_start, week_end, amount FROM weekly_savings
        WHERE goal_id = $1;
      `;

      const goalInfo = await db.query(goalQuery, [goalId]);
      const savingsInfo = await db.query(weeklySavingsQuery, [goalId]);
      
      goalInfo.rows[0].savingsData = savingsInfo.rows;

      res.json(goalInfo.rows[0]);
    } catch (error) {
      res.sendStatus(500);
    }

  });

  router.get('/users', async (req, res) => {
    try {
      const userQuery = `
        SELECT id, first_name, last_name, photourl FROM users;
      `;

      const usersInfo = await db.query(userQuery);

      res.json(usersInfo.rows);

    } catch (error) {
      res.sendStatus(500);
    }
  })

  return router;

};