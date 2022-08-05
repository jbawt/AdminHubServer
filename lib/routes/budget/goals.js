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

  router.post('/update/weekly-savings', async (req, res) => {
    const { amount, goalId, weekStart, weekEnd } = req.body;

    try {

      // check to see if its during the most recent week inserted
      const savingsQuery = `
        SELECT * FROM weekly_savings
        WHERE goal_id = $1
        ORDER BY week_start DESC
        LIMIT 1;
      `;

      const mostRecentEntry = await db.query(savingsQuery, [goalId]);
      const entryData = mostRecentEntry.rows.length > 0 ? mostRecentEntry.rows[0] : null;

      if (entryData !== null) {

        if (new Date(weekStart) > new Date(entryData.week_start) && new Date(weekEnd) < new Date(entryData.week_end)) {

          const updateQuery = `
            UPDATE weekly_savings
            SET amount = $1
            WHERE id = $2;
          `;
          const updatedListQuery = `
            SELECT week_start, week_end, amount FROM weekly_savings
            WHERE goal_id = $1;
          `;
  
          await db.query(updateQuery, [(amount + entryData.amount), entryData.id])
          const updatedList = await db.query(updatedListQuery, [goalId]);
  
          res.json(updatedList.rows);
  
        } else {
  
          const updateQuery = `
            INSERT INTO weekly_savings (goal_id, week_start, week_end, amount)
            VALUES ($1, $2, $3, $4);
          `;
          const updatedListQuery = `
            SELECT week_start, week_end, amount FROM weekly_savings
            WHERE goal_id = $1;
          `;
          
          await db.query(updateQuery, [goalId, weekStart, weekEnd, amount]);
          const updatedList = await db.query(updatedListQuery, [goalId]);
  
          res.json(updatedList.rows);
  
        }

      } else {
  
        const updateQuery = `
          INSERT INTO weekly_savings (goal_id, week_start, week_end, amount)
          VALUES ($1, $2, $3, $4);
        `;
        const updatedListQuery = `
          SELECT week_start, week_end, amount FROM weekly_savings
          WHERE goal_id = $1;
        `;
        
        await db.query(updateQuery, [goalId, weekStart, weekEnd, amount]);
        const updatedList = await db.query(updatedListQuery, [goalId]);

        res.json(updatedList.rows);

      }

    } catch (error) {
      res.sendStatus(500);
    }

  });

  return router;

};