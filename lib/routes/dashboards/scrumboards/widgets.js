const CH = require('./mainChartHelpers');
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

    // CHART WIDGET
		const gitToken = await db.query('SELECT github_token FROM users WHERE id = $1;', [claim.id])
		const gitAccessToken = gitToken.rows[0].github_token;

		if (gitAccessToken !== null) {

      const skeleton = widget5.skeleton;

			const gitIssues = await axios.get(`${process.env.GITHUB_API_URL}/repos/${repo.fullName}/issues?state=all`, {
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

      // THIS WEEK SUPPORTING CHART DATA
      const thisWeek = CH.getIssueData(issues, 0);
      const thisWeekBugs = CH.getBugs(issues, 0);
      const thisWeekWontFix = CH.getWontFix(issues, 0);
      const thisWeekEnhance = CH.getEnhancementIssues(issues, 0);
      const thisWeekQuestions = CH.getQuestions(issues, 0);
      const thisWeekTotal = CH.calcTotal(thisWeek);
      const thisWeekClosed = CH.calcClosed(thisWeek);
      const thisWeekArr = CH.getTotalData(thisWeek);
      const thisWeekClosedArr = CH.getTotalClosedData(thisWeek);
      const thisWeekBugsArr = CH.getTotalData(thisWeekBugs);
      const thisWeekBugTotal = CH.calcTotal(thisWeekBugs);
      const thisWeekWontFixArr = CH.getTotalData(thisWeekWontFix);
      const thisWeekWontFixTotal = CH.calcTotal(thisWeekWontFix);
      const thisWeekEnhanceArr = CH.getTotalData(thisWeekEnhance);
      const thisWeekEnhanceTotal = CH.calcTotal(thisWeekEnhance);
      const thisWeekQuestionArr = CH.getTotalData(thisWeekQuestions);
      const thisWeekQuestionTotal = CH.calcTotal(thisWeekQuestions);

      skeleton.mainChart.TW.series = thisWeek;
      skeleton.supporting.created.count.TW = thisWeekTotal;
      skeleton.supporting.created.chart.TW.series[0].data = thisWeekArr;
      skeleton.supporting.closed.count.TW = thisWeekClosed;
      skeleton.supporting.closed.chart.TW.series[0].data = thisWeekClosedArr;
      skeleton.supporting.reOpened.count.TW = thisWeekBugTotal;
      skeleton.supporting.reOpened.chart.TW.series[0].data = thisWeekBugsArr;
      skeleton.supporting.wontFix.count.TW = thisWeekWontFixTotal;
      skeleton.supporting.wontFix.chart.TW.series[0].data = thisWeekWontFixArr;
      skeleton.supporting.enhancement.count.TW = thisWeekEnhanceTotal;
      skeleton.supporting.enhancement.chart.TW.series[0].data = thisWeekEnhanceArr;
      skeleton.supporting.question.count.TW = thisWeekQuestionTotal;
      skeleton.supporting.question.chart.TW.series[0].data = thisWeekQuestionArr;

      // LAST WEEK SUPPORTING CHART DATA
      const lastWeek = CH.getIssueData(issues, 7);
      const lastWeekBugs = CH.getBugs(issues, 7);
      const lastWeekWontFix = CH.getWontFix(issues, 7);
      const lastWeekEnhance = CH.getEnhancementIssues(issues, 7);
      const lastWeekQuestions = CH.getQuestions(issues, 7);
      const lastWeekTotal = CH.calcTotal(lastWeek);
      const lastWeekClosed = CH.calcClosed(lastWeek);
      const lastWeekArr = CH.getTotalData(lastWeek);
      const lastWeekClosedArr = CH.getTotalClosedData(lastWeek);
      const lastWeekBugArr = CH.getTotalData(lastWeekBugs);
      const lastWeekBugTotal = CH.calcTotal(lastWeekBugs);
      const lastWeekWontFixArr = CH.getTotalData(lastWeekWontFix);
      const lastWeekWontFixTotal = CH.calcTotal(lastWeekWontFix);
      const lastWeekEnhanceArr = CH.getTotalData(lastWeekEnhance);
      const lastWeekEnhanceTotal = CH.calcTotal(lastWeekEnhance);
      const lastWeekQuestionArr = CH.getTotalData(lastWeekQuestions);
      const lastWeekQuestionTotal = CH.calcTotal(lastWeekQuestions);

      skeleton.mainChart.LW.series = lastWeek;
      skeleton.supporting.created.count.LW = lastWeekTotal;
      skeleton.supporting.created.chart.LW.series[0].data = lastWeekArr;
      skeleton.supporting.closed.count.LW = lastWeekClosed;
      skeleton.supporting.closed.chart.LW.series[0].data = lastWeekClosedArr;
      skeleton.supporting.reOpened.count.LW = lastWeekBugTotal;
      skeleton.supporting.reOpened.chart.LW.series[0].data = lastWeekBugArr;
      skeleton.supporting.wontFix.count.LW = lastWeekWontFixTotal;
      skeleton.supporting.wontFix.chart.LW.series[0].data = lastWeekWontFixArr;
      skeleton.supporting.enhancement.count.LW = lastWeekEnhanceTotal;
      skeleton.supporting.enhancement.chart.LW.series[0].data = lastWeekEnhanceArr;
      skeleton.supporting.question.count.LW = lastWeekQuestionTotal;
      skeleton.supporting.question.chart.LW.series[0].data = lastWeekQuestionArr;

      // TWO WEEKS AGO SUPPORTING CHART DATA
      const twoWeeks = CH.getIssueData(issues, 14);
      const twoWeekBugs = CH.getBugs(issues, 14);
      const twoWeekWontFix = CH.getWontFix(issues, 14);
      const twoWeekEnhance = CH.getEnhancementIssues(issues, 14);
      const twoWeekQuestions = CH.getQuestions(issues, 14);
      const twoWeekTotal = CH.calcTotal(twoWeeks);
      const twoWeekClosed = CH.calcClosed(twoWeeks);
      const twoWeekArr = CH.getTotalData(twoWeeks);
      const twoWeekClosedArr = CH.getTotalClosedData(twoWeeks);
      const twoWeekBugArr = CH.getTotalData(twoWeekBugs);
      const twoWeekBugsTotal = CH.calcTotal(twoWeekBugs);
      const twoWeekWontFixArr = CH.getTotalData(twoWeekWontFix);
      const twoWeekWontFixTotal = CH.calcTotal(twoWeekWontFix);
      const twoWeekEnhanceArr = CH.getTotalData(twoWeekEnhance);
      const twoWeekEnhanceTotal = CH.calcTotal(twoWeekEnhance);
      const twoWeekQuestionArr = CH.getTotalData(twoWeekQuestions);
      const twoWeekQuestionTotal = CH.calcTotal(twoWeekQuestions);

      skeleton.mainChart["2W"].series = twoWeeks;
      skeleton.supporting.created.count["2W"] = twoWeekTotal;
      skeleton.supporting.created.chart["2W"].series[0].data = twoWeekArr;
      skeleton.supporting.closed.count["2W"] = twoWeekClosed;
      skeleton.supporting.closed.chart["2W"].series[0].data = twoWeekClosedArr;
      skeleton.supporting.reOpened.count["2W"] = twoWeekBugsTotal;
      skeleton.supporting.reOpened.chart["2W"].series[0].data = twoWeekBugArr;
      skeleton.supporting.wontFix.count["2W"] = twoWeekWontFixTotal;
      skeleton.supporting.wontFix.chart["2W"].series[0].data = twoWeekWontFixArr;
      skeleton.supporting.enhancement.count["2W"] = twoWeekEnhanceTotal;
      skeleton.supporting.enhancement.chart["2W"].series[0].data = twoWeekEnhanceArr;
      skeleton.supporting.question.count["2W"] = twoWeekQuestionTotal;
      skeleton.supporting.question.chart["2W"].series[0].data = twoWeekQuestionArr;

			widgets.push(skeleton);
		}

    res.json(widgets);
  });

  return router;

}