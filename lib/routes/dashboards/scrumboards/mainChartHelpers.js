/**
 * @param {array of objects} issues 
 * @param {how many weeks to go back in days} daysBack 
 * @returns array of issues and closed issues for each day of the week.
 */
function getIssueData(issues, daysBack) {

  const curr = new Date();
  const first = curr.getDate() - curr.getDay() - daysBack;
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



/**
 * Same functionality as above. Only calculates for issues
 * with the either the 'bug'/'wont fix'/'enhancement'/'question' tags in the labels array of the object
 * depending on the function used.
 */
function getBugs(issues, daysBack) {
  const bugIssues = [];

  issues.map(issue => {
    issue.labels.map(label => {
      if (label.name === 'bug') {
        bugIssues.push(issue);
      }
    })
  });

  const data = getIssueData(bugIssues, daysBack);

  return data;

}

function getWontFix(issues, daysBack) {
  const wontFix = [];

  issues.map(issue => {
    issue.labels.map(label => {
      if (label.name === 'wontfix') {
        wontFix.push(issue);
      }
    })
  });

  const data = getIssueData(wontFix, daysBack);

  return data;

}

function getEnhancementIssues(issues, daysBack) {
  const enhancements = [];

  issues.map(issue => {
    issue.labels.map(label => {
      if (label.name === 'enhancement') {
        enhancements.push(issue);
      }
    })
  });

  const data = getIssueData(enhancements, daysBack);

  return data;
  
}

function getQuestions(issues, daysBack) {
  const questions = [];

  issues.map(issue => {
    issue.labels.map(label => {
      if (label.name === 'question') {
        questions.push(issue);
      }
    })
  });

  const data = getIssueData(questions, daysBack);

  return data;

}



/**
 * List of helper functions used in the Widgets file
 */
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
  getIssueData,
  calcClosed,
  calcTotal,
  getTotalClosedData,
  getTotalData,
  getBugs,
  getWontFix,
  getEnhancementIssues,
  getQuestions,
}