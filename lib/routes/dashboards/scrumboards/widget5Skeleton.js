const skeleton = {
  id: 'widget5',
  title: 'Github Issues',
  ranges: {
    TW: 'This Week',
    LW: 'Last Week',
    '2W': '2 Weeks Ago'
  },
  mainChart: {
    TW: {
      series: [
        {
          name: 'Issues',
          data: [42, 28, 43, 34, 20, 25, 22]
        },
        {
          name: 'Closed issues',
          data: [11, 10, 8, 11, 8, 10, 17]
        }
      ]
    },
    '2W': {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      series: [
        {
          name: 'Issues',
          data: [37, 32, 39, 27, 18, 24, 20]
        },
        {
          name: 'Closed issues'
        }
      ]
    },
    LW: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      series: [
        {
          name: 'Issues',
          data: [37, 24, 51, 31, 29, 17, 31]
        },
        {
          name: 'Closed issues',
          data: [12, 8, 7, 13, 7, 6, 10]
        }
      ]
    },
    options: {
      chart: {
        height: '100%',
        type: 'bar',
        stacked: true,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '90%',
          horizontal: false
        }
      },
      xaxis: {
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        followCursor: true,
        theme       : 'dark',
        fixed: {
          enabled: false,
          position: 'topRight',
          offsetX: 0,
          offsetY: 0,
        },
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      }
    }
  },
  supporting: {
    created: {
      name: 'CREATED',
      count: {
        '2W': 48,
        LW: 46,
        TW: 54
      },
      chart: {
        '2W': {
          series: [
            {
              name: 'Created',
              data: [5, 8, 5, 6, 7, 8, 7]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [6, 3, 7, 5, 5, 4, 7]
            }
          ]
        },
        TW: {
          series: [
            {
              name: 'Created',
              data: [3, 2, 1, 4, 8, 8, 4]
            }
          ]
        },
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    },
    closed: {
      name: 'CLOSED',
      count: {
        '2W': 27,
        LW: 31,
        TW: 26
      },
      chart: {
        TW: {
          series: [
            {
              name: 'Created',
              data: [6, 3, 7, 5, 5, 4, 7]
            }
          ]
        },
        '2W': {
          series: [
            {
              name: 'Created',
              data: [3, 2, 1, 4, 8, 8, 4]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [6, 5, 4, 5, 7, 4, 7]
            }
          ]
        },
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    },
    reOpened: {
      name: 'RE-OPENED',
      count: {
        '2W': 4,
        LW: 5,
        TW: 2
      },
      chart: {
        '2W': {
          series: [
            {
              name: 'Created',
              data: [6, 3, 7, 5, 5, 4, 7]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [5, 7, 8, 8, 6, 4, 1]
            }
          ]
        },
        TW: {
          series: [
            {
              name: 'Created',
              data: [3, 2, 1, 4, 8, 8, 4]
            }
          ]
        },
        TW2: [
          {
            name: 'RE-OPENED',
            series: [
              {
                name: 'Mon',
                value: 3
              },
              {
                name: 'Tue',
                value: 2
              },
              {
                name: 'Wed',
                value: 1
              },
              {
                name: 'Thu',
                value: 4
              },
              {
                name: 'Fri',
                value: 8
              },
              {
                name: 'Sat',
                value: 8
              },
              {
                name: 'Sun',
                value: 4
              }
            ]
          }
        ],
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    },
    wontFix: {
      name: "WON'T FIX",
      count: {
        '2W': 6,
        LW: 3,
        TW: 4
      },
      chart: {
        '2W': {
          series: [
            {
              name: 'Created',
              data: [5, 7, 4, 6, 5, 3, 2]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [6, 3, 7, 5, 5, 4, 7]
            }
          ]
        },
        TW: {
          series: [
            {
              name: 'Created',
              data: [6, 5, 4, 5, 7, 4, 7]
            }
          ]
        },
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    },
    needsTest: {
      name: 'NEEDS TEST',
      count: {
        '2W': 10,
        LW: 7,
        TW: 8
      },
      chart: {
        '2W': {
          series: [
            {
              name: 'Created',
              data: [6, 5, 4, 5, 7, 4, 7]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [5, 7, 8, 8, 6, 4, 1]
            }
          ]
        },
        TW: {
          series: [
            {
              name: 'Created',
              data: [6, 3, 7, 5, 5, 4, 7]
            }
          ]
        },
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    },
    fixed: {
      name: 'FIXED',
      count: {
        '2W': 21,
        LW: 17,
        TW: 14
      },
      chart: {
        '2W': {
          series: [
            {
              name: 'Created',
              data: [5, 7, 8, 8, 6, 4, 1]
            }
          ]
        },
        LW: {
          series: [
            {
              name: 'Created',
              data: [6, 5, 4, 5, 7, 4, 7]
            }
          ]
        },
        TW: {
          series: [
            {
              name: 'Created',
              data: [5, 7, 4, 6, 5, 3, 2]
            }
          ]
        },
        options: {
          chart: {
            type: 'area',
            height: '100%',
            sparkline: {
              enabled: true
            }
          },
          stroke: { width: 2 },
          grid: {
            padding: {
              top: 10,
              right: 0,
              bottom: 10,
              left: 0
            }
          },
          fill: {
            type: 'solid',
            opacity: 0.7
          },
          tooltip: {
            followCursor: true,
            theme       : 'dark',
            fixed: {
              enabled: false,
              position: 'topRight',
              offsetX: 0,
              offsetY: 0,
            },
          },
          xaxis: {
            categories: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ]
          }
        }
      }
    }
  }
};

module.exports = { skeleton };