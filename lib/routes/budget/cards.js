const router = require('express').Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {

  router.post('/update', async (req, res) => {
    const { id, name, description, members, memberIds, savingsGoal } = req.body;
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);

    const currentMembers = members.map((member) => member.id);

    if (verified) {

      try {
        const claim = jwt.decode(token);
        const querys = {
          newMember: `
            INSERT INTO goal_members (user_id, goal_id)
            VALUES ($1, $2);
          `,
          removeMember: `
            DELETE FROM goal_members
            WHERE user_id = $1
            AND goal_id = $2;
          `,
          updateCard: `
            UPDATE goals
            SET name = $1,
                description = $2,
                savings_goal = $3
            WHERE id = $4
          `,
          goals: `
            SELECT goals.id, name, description, savings_goal
            FROM goals
            JOIN goal_members ON goals.id = goal_members.goal_id
            WHERE user_id = $1
            ORDER BY goals.id;
          `,
          goalMembers: `
            SELECT users.id, first_name, last_name, photourl
            FROM users JOIN goal_members ON users.id = goal_members.user_id
            WHERE goal_members.goal_id = $1;
          `,
          savedAmount: `
            SELECT sum(amount) as amount
            FROM weekly_savings
            WHERE goal_id = $1;
          `,
          users: `
            SELECT id, first_name, last_name, photourl FROM users;
          `,
        };
     
        if (currentMembers < memberIds) {
          const membersToAdd = memberIds.filter(memberId => !currentMembers.includes(memberId));
    
          await Promise.all(membersToAdd.map(async (memberId) => {
            await db.query(querys.newMember, [memberId, id]);
          }));
    
        } else if (currentMembers > memberIds) {
          const membersToRemove = currentMembers.filter(memberId => !memberIds.includes(memberId));
          
          await Promise.all(membersToRemove.map(async (memberId) => {
            await db.query(querys.removeMember, [memberId, id]);
          }));
        }
    
        await db.query(querys.updateCard, [name, description, savingsGoal, id]);
  
        const goalInfo = await db.query(querys.goals, [claim.id]);

        const goalInfoWithMemsAndAmount = await Promise.all(goalInfo.rows.map(async (goal) => {

          const memberInfo = await db.query(querys.goalMembers, [goal.id]);
          const savingsInfo = await db.query(querys.savedAmount, [goal.id]);
          const usersInfo = await db.query(querys.users);
          const memberIds = memberInfo.rows.map(member => member.id);

          goal.members = memberInfo.rows;
          goal.amountSaved = Number(savingsInfo.rows[0].amount);
          goal.users = usersInfo.rows;
          goal.memberIds = memberIds;

          return goal;
        }));

        res.json(goalInfoWithMemsAndAmount);
        
      } catch (error) {
        res.sendStatus(500);
      }

    } else {
      res.sendStatus(403);
    }

  });

  return router;

};