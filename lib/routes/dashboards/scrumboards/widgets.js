const widget5 = require('./widget5Skeleton');
const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function formatDay(date) {
  const dateIndex = new Date(date).getDay();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dateIndex];
}

module.exports = (db) => {

  router.get('/widgets', async (req, res) => {
    const { authorization } = req.headers;
    const repo = req.query;
    const token = authorization.split(" ")[1];
    const claim = jwt.decode(token);

    const widgets = [];

    // CHECK GITHUB TOKEN
    const gitHubToken = await db.query('SELECT github_token FROM users WHERE id = $1;', [claim.id]);
    widgets.push({
      id: 'gitToken',
      token: gitHubToken.rows[0].github_token,
      clientId: process.env.GITHUB_CLIENT_ID,
    });

    // WEATHER WIDGET
    const postalCode = await db.query('SELECT postal_code FROM users_info WHERE user_id = $1;', [claim.id]);
    const postal = postalCode.rows[0].postal_code;
    const currentWeatherRes = await axios.get(`${process.env.CURRENT_WEATHER_API_URL}?postal_code=${postal}&country=CA&key=${process.env.WEATHER_API_KEY}`);
    const dailyWeatherRes = await axios.get(`${process.env.DAILY_WEATHER_API_URL}?postal_code=${postal}&country=CA&key=${process.env.WEATHER_API_KEY}&days=6`);
    const weather = currentWeatherRes.data.data[0];
    const dailyWeather = dailyWeatherRes.data.data;
    const location = weather.city_name.replace(' ', '');

    widgets.push(
      {
        id: 'weatherWidget',
        locations: {
          [location]: {
            name: weather.city_name,
            description: weather.weather.description,
            icon: weather.weather.icon,
            temp: {
              C: weather.temp,
            },
            windSpeed: {
              KMH: weather.wind_spd.toFixed(1),
            },
            windDirection: weather.wind_cdir,
            rainProbability: `${Math.round(weather.precip * 100)}%`,
            next5Days: [
              {
                name: await formatDay(dailyWeather[1].datetime),
                icon: dailyWeather[1].weather.icon,
                temp: {
                  C: dailyWeather[1].temp,
                }
              },
              {
                name: await formatDay(dailyWeather[2].datetime),
                icon: dailyWeather[2].weather.icon,
                temp: {
                  C: dailyWeather[2].temp,
                }
              },
              {
                name: await formatDay(dailyWeather[3].datetime),
                icon: dailyWeather[3].weather.icon,
                temp: {
                  C: dailyWeather[3].temp,
                }
              },
              {
                name: await formatDay(dailyWeather[4].datetime),
                icon: dailyWeather[4].weather.icon,
                temp: {
                  C: dailyWeather[4].temp,
                }
              },
              {
                name: await formatDay(dailyWeather[5].datetime),
                icon: dailyWeather[5].weather.icon,
                temp: {
                  C: dailyWeather[5].temp,
                }
              }
            ]
          }
        },
        currentLocation: location,
        tempUnit: 'C',
        speedUnit: 'KMH',
      },
    );

    /**
     * TODOS WIDGET FOR DASHBOARD
     * These are not specific to any scrumboard but rather
     * stay uniform across all subscribed scrumboard selction options
     */
    // TOTAL TASK WIDGET
    const totalTodosReq = await db.query('SELECT count(*) AS tasks FROM todos WHERE deleted = $1 AND user_id =$2;', [false, claim.id]);
    const completeTodosReq = await db.query('SELECT count(*) AS tasks FROM todos WHERE completed = $1 AND deleted = $2 AND user_id = $3;', [true, false, claim.id]);
    widgets.push({
      id: 'widget2',
      title: 'Total',
      data: {
        name: 'Tasks',
        count: totalTodosReq.rows[0].tasks,
        extra: {
          name: 'Completed',
          count: completeTodosReq.rows[0].tasks,
        }
      }
    });

    // DUE TASK WIDGET
    const todosReq = await db.query('SELECT * FROM todos WHERE deleted = $1 AND user_id = $2;', [false, claim.id]);
    const today = new Date(Date.now()).getDate();
    const month = new Date(Date.now()).getMonth();
    const year = new Date(Date.now()).getFullYear();
    const dueToday = todosReq.rows.filter(todo => todo.due_date.getDate() === today && todo.due_date.getMonth() === month && todo.due_date.getFullYear() === year);
    const dueTomorrow = todosReq.rows.filter(todo => todo.due_date.getDate() === (today + 1) && todo.due_date.getMonth() === month && todo.due_date.getFullYear() === year);
    const dueTwoDays = todosReq.rows.filter(todo => todo.due_date.getDate() === (today + 2) && todo.due_date.getMonth() === month && todo.due_date.getFullYear() === year);
    const next3DayCount = dueToday.length + dueTomorrow.length + dueTwoDays.length;
    widgets.push({
      id: 'widget1',
      ranges: {
        DT: 'Today',
        DTM: 'Tomorrow',
        DTD: 'Two Days',
      },
      currentRange: 'DT',
      data: {
        name: 'Due Tasks',
        count: {
          DT: dueToday.length,
          DTM: dueTomorrow.length,
          DTD: dueTwoDays.length,
        },
        extra: {
          name: 'Next 3 Days',
          count: {
            DT: next3DayCount,
            DTM: next3DayCount,
            DTD: next3DayCount,
          },
        },
      }
    });

    // OVERDUE TASK WIDGET
    const overDue = todosReq.rows.filter(todo => todo.due_date < new Date(Date.now()) && todo.completed === false);
    widgets.push({
      id: 'widget3',
      title: 'Overdue',
      data: {
        name: 'Tasks',
        count: overDue.length,
        extra: {
          name: 'Get Done ASAP',
          count: overDue.length,
        },
      },
    });

    // IMPORTANT TASK WIDGET
    const important = todosReq.rows.filter(todo => todo.important === true && todo.completed === false);
    const overDueImportant = todosReq.rows.filter(todo => todo.important === true && todo.due_date < new Date(Date.now()) && todo.completed === false);
    widgets.push({
      id: 'widget4',
      title: 'Priority',
      data: {
        name: 'Tasks',
        count: important.length,
        extra: {
          name: 'Overdue',
          count: overDueImportant.length,
        },
      }
    });

		const gitToken = await db.query('SELECT github_token FROM users WHERE id = $1;', [claim.id])
		const gitAccessToken = gitToken.rows[0].github_token;

		if (gitAccessToken !== null) {

      const skeleton = widget5.skeleton;

			const gitIssues = await axios.get(`${process.env.GITHUB_API_URL}/repos/${repo.fullName}/issues`, {
				headers: {
					'Accept': 'application/vnd.github.v3+json',
					'Authorization': `token ${gitAccessToken}` 
				}
			});

      const issues = gitIssues.data.map(issue => {
        return {
          title: issue.title,
          state: issue.state,
          labels: issue.labels,
          created: issue.created_at,
          closed: issue.closed_at,
        }
      });

      const curr = new Date();
      const first = curr.getDate() - curr.getDay();
      const second = first + 1;
      const third = first + 2;
      const fourth = first + 3;
      const fifth = first + 4;
      const sixth = first + 5;
      const last = first + 6;
      const sunday = new Date(curr.setDate(first)).toISOString();
      const monday = new Date(curr.setDate(second)).toISOString();
      const tuesday = new Date(curr.setDate(third)).toISOString();
      const wed = new Date(curr.setDate(fourth)).toISOString();
      const thurs = new Date(curr.setDate(fifth)).toISOString();
      const fri = new Date(curr.setDate(sixth)).toISOString();
      const saturday = new Date(curr.setDate(last)).toISOString();

      const thisWeeksIssues = issues.filter(issue => issue.created > sunday && issue.created < saturday);

      if (thisWeeksIssues.length <= 0) {
        skeleton.mainChart.TW.series = [
          {
            name: 'Issues',
            data: [0, 0, 0, 0, 0, 0, 0],
          },
          {
            name: 'Closed Issues',
            data: [0, 0, 0, 0, 0, 0, 0],
          }
        ]
      } else {
        console.log(thisWeeksIssues);
      }

			widgets.push(skeleton);
		}

    res.json(widgets);
  });

  return router;

}