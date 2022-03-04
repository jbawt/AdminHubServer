const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
require('dotenv').config();

const oAuth2Client = new OAuth2(
  process.env.GOOGLE_OAUTH_CLIENTID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

module.exports = (db) => {

  router.get('/events', async (req, res) => {

    try {

      const fuseCalendar = await calendar.events.list({ calendarId: process.env.CALENDAR_ID });
      const canadaHolidays = await calendar.events.list({ calendarId: process.env.CANADA_HOLIDAY_CALENDAR_ID });
      const myCalendar = await calendar.events.list({ calendarId: process.env.MY_CALENDAR_ID });

      const fuseEvents = fuseCalendar.data.items.map(item => {

        let allDay = false;
        let description;

        if (item.description) {
          description = item.description;
          if (item.description.includes('(All Day)')) {
            allDay = true;
          }
        } else {
          description = '';
        }

        return {
          id: item.id,
          title: item.summary,
          start: item.start.dateTime ? item.start.dateTime : item.start.date,
          end: item.end.dateTime ? item.end.dateTime : item.end.date,
          allDay: allDay,
          extendedProps: {
            desc: description,
          },
        };

      });

      const canadaEvents = canadaHolidays.data.items.map(item => {

        return {
          id: item.id,
          title: item.summary,
          start: item.start.dateTime ? item.start.dateTime : item.start.date,
          end: item.end.dateTime ? item.end.dateTime : item.end.date,
          allDay: true,
          extendedProps: {
            desc: item.description,
          },
        };

      });

      const myEvents = myCalendar.data.items.map(item => {

        return {
          id: item.id,
          title: item.summary,
          start: item.start.dateTime ? item.start.dateTime : item.start.date,
          end: item.end.dateTime ? item.end.dateTime : item.end.date,
          extendedProps: {
            desc: item.description,
          },
        };

      });

      const resArr = [...fuseEvents, ...canadaEvents, ...myEvents];

      res.json(resArr);
      
    } catch (error) {
      
      console.log(error);

    }
  
  });

  router.post('/add-event', (req, res) => {

    const { title, start, end, extendedProps, allDay } = req.body.newEvent;
    const { desc } = extendedProps;

    const event = {
      summary: title,
      description: allDay ? `(All Day) ${desc}` : desc,
      start: {
        dateTime: start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
    };

    // CHECK IF THERE IS ALREADY AN EVENT
    // calendar.freebusy.query({
    //   resource: {
    //     timeMin: start,
    //     timeMax: end,
    //     timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    //     items: [{ id: process.env.CALENDAR_ID }, { id: process.env.MY_CALENDAR_ID }],
    //   },
    // }, (error, response)  => {

    //   if (error) return console.log('Free Busy Query Error: ', error);

    //   response.data.calendars

    // });

    try {
     
      calendar.events.insert({
        calendarId: process.env.CALENDAR_ID,
        resource: event, 
      }, (err, response) => {
        if (err) {
          console.log('There was an error contacting the Calendar service: ', err);
          return;
        };
        
        const resObj = {
          id: response.data.id,
          title,
          start,
          end,
          allDay,
          extendedProps 
        };

        res.json(resObj);

      });

    } catch (error) {
      console.log(error); 
    }

  });

  router.post('/remove-event', (req, res) => {

    const { eventId } = req.body;

    calendar.events.delete({ calendarId: process.env.CALENDAR_ID, eventId: eventId });

    res.json({ id: eventId });

  });

  router.post('/update-event', async (req, res) => {

    const { id, title, allDay, start, end, extendedProps } = req.body.event;
    const { desc } = extendedProps;

    const event = await calendar.events.get({ calendarId: process.env.CALENDAR_ID, eventId: id });

    event.data.summary = title;
    event.data.description = desc;
    event.data.start.dateTime = start;
    event.data.end.dateTime = end;

    calendar.events.update({ calendarId: process.env.CALENDAR_ID, eventId: id, requestBody: event.data }, (error, response) => {
      if (error) {
        console.log(error);
        return;
      }
      const updatedEvent = response.data;

      const resObj = {
        id: updatedEvent.id,
        title,
        start,
        end,
        allDay,
        extendedProps
      };

      res.json(resObj);
    });

  });
  
  return router;

}