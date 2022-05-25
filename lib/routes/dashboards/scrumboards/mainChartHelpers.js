// This week
function thisWeek(issues) {

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
    return [
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
    const issueData = [];
    const closedData = [];
    const week = [sunday, monday, tuesday, wed, thurs, fri, saturday];

    for (let i = 0; i < week.length; i++) {
      let dayCount = 0;
      let closedDayCount = 0;
      for (let j = 0; j < thisWeeksIssues.length; j++) {
        if (new Date(thisWeeksIssues[j].created).getDay() === new Date(week[i]).getDay()) {
          dayCount += 1;
          if (new Date(thisWeeksIssues[j].closed).getDay() === new Date(week[i]).getDay()) {
            closedDayCount += 1;
          }
        }
      }
      issueData.push(dayCount);
      closedData.push(closedDayCount);
    }

    return [
      {
        name: 'Issues',
        data: issueData,
      },
      {
        name: 'Closed Issues',
        data: closedData,
      }
    ];

  }

}

// Last week
function lastWeek(issues) {

  const curr = new Date();
  const lastWeekFirst = curr.getDate() - curr.getDay() - 7;
  const lastSec = lastWeekFirst + 1;
  const lastThir = lastWeekFirst + 2;
  const lastFour = lastWeekFirst + 3;
  const lastFifth = lastWeekFirst + 4;
  const lastSix = lastWeekFirst + 5;
  const lastSev = lastWeekFirst + 6;
  const lastSun = new Date(curr.setDate(lastWeekFirst)).toISOString();
  const lastMon = new Date(curr.setDate(lastSec)).toISOString();
  const lastTue = new Date(curr.setDate(lastThir)).toISOString();
  const lastWed = new Date(curr.setDate(lastFour)).toISOString();
  const lastThur = new Date(curr.setDate(lastFifth)).toISOString();
  const lastFri = new Date(curr.setDate(lastSix)).toISOString();
  const lastSat = new Date(curr.setDate(lastSev)).toISOString();

  const lastWeeksIssues = issues.filter(issue => issue.created > lastSun && issue.created < lastSat);

  if (lastWeeksIssues.length <= 0) {
    return [
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
    const issueData = [];
    const closedData = [];
    const week = [lastSun, lastMon, lastTue, lastWed, lastThur, lastFri, lastSat];

    for (let i = 0; i < week.length; i++) {
      let dayCount = 0;
      let closedDayCount = 0;
      for (let j = 0; j < lastWeeksIssues.length; j++) {
        if (new Date(lastWeeksIssues[j].created).getDay() === new Date(week[i]).getDay()) {
          dayCount += 1;
          if (new Date(lastWeeksIssues[j].closed).getDay() === new Date(week[i]).getDay()) {
            closedDayCount += 1;
          }
        }
      }
      issueData.push(dayCount);
      closedData.push(closedDayCount);
    }

    return [
      {
        name: 'Issues',
        data: issueData,
      },
      {
        name: 'Closed Issues',
        data: closedData,
      }
    ];

  }

}

// two weeks
function twoWeeks(issues) {

  const curr = new Date();
  const twoWeekFirst = curr.getDate() - curr.getDay() - 14;
  const twoSec = twoWeekFirst + 1;
  const twoThir = twoWeekFirst + 2;
  const twoFour = twoWeekFirst + 3;
  const twoFifth = twoWeekFirst + 4;
  const twoSix = twoWeekFirst + 5;
  const twoSev = twoWeekFirst + 6;
  const twoSun = new Date(curr.setDate(twoWeekFirst)).toISOString();
  const twoMon = new Date(curr.setDate(twoSec)).toISOString();
  const twoTue = new Date(curr.setDate(twoThir)).toISOString();
  const twoWed = new Date(curr.setDate(twoFour)).toISOString();
  const twoThur = new Date(curr.setDate(twoFifth)).toISOString();
  const twoFri = new Date(curr.setDate(twoSix)).toISOString();
  const twoSat = new Date(curr.setDate(twoSev)).toISOString();

  const twoWeeksIssues = issues.filter(issue => issue.created > twoSun && issue.created < twoSat);

  if (twoWeeksIssues.length <= 0) {
    return [
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
    const issueData = [];
    const closedData = [];
    const week = [twoSun, twoMon, twoTue, twoThur, twoFri, twoSat];

    for (let i = 0; i < week.length; i++) {
      let dayCount = 0;
      let closedDayCount = 0;
      for (let j = 0; j < twoWeeksIssues.length; j++) {
        if (new Date(twoWeeksIssues[j].created).getDay() === new Date(week[i]).getDay()) {
          dayCount += 1;
          if (new Date(twoWeeksIssues[j].closed).getDay() === new Date(week[i]).getDay()) {
            closedDayCount += 1;
          }
        }
      }
      issueData.push(dayCount);
      closedData.push(closedDayCount);
    }

    return [
      {
        name: 'Issues',
        data: issueData,
      },
      {
        name: 'Closed Issues',
        data: closedData,
      }
    ];

  }

};

const calcTotal = (objArr) => {
  let total = 0;
  objArr.forEach(obj => {
    total += obj.data.reduce((a, b) => a + b);
  });
  return total;
};

const calcClosed = (objArr) => {
  let total = 0;
  objArr.map(obj => {
    if (obj.name === 'Closed Issues') {
      total += obj.data.reduce((a, b) => a + b);
    }
  });
  return total;
}

const getTotalData = (objArr) => {
  const result = objArr[0].data;
  for (let i = 0; i < objArr[1].data.length; i++) {
    result[i] += objArr[1].data[i];
  }
  return result;
}

const getTotalClosedData = (objArr) => {
  let result;
  objArr.map(obj => {
    if (obj.name === 'Closed Issues') {
      result = obj.data;
    }
  });
  return result;
}

module.exports = {
  thisWeek,
  lastWeek,
  twoWeeks,
  calcClosed,
  calcTotal,
  getTotalClosedData,
  getTotalData,
}