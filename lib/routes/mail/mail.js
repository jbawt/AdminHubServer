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

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// getting header fields from gmail res
const extractField = (json, fieldName) => {
  return json.data.payload.headers.filter((header) => {
    return header.name === fieldName;
  })[0].value;
};

module.exports = (db) => {

  router.get('/mails', async (req, res) => {
    const { folderHandle } = req.query;
    const label = folderHandle.toUpperCase();

    const messages = await gmail.users.messages.list({ userId: 'jbawtinheimer@gmail.com', maxResults: 200, labelIds: [label, 'CATEGORY_PERSONAL'] });

    if (!messages.data.messages) {
      res.json([]);
      return;
    };

    const resMessages = await Promise.all(messages.data.messages.map(async (message) => {
      const messageData = await gmail.users.messages.get({ userId: 'jbawtinheimer@gmail.com', id: message.id });
      const date = extractField(messageData, 'Date');
      const subject = extractField(messageData, 'Subject');
      const from = extractField(messageData, 'From');
      const to = extractField(messageData, 'Delivered-To');
      const snippet = messageData.data.snippet;

      const messageObj = {
        id: message.id,
        from: {
          name: from,
          avatar: '',
          email: from,
        },
        to: [
          {
            name: 'me',
            email: to,
          },
        ],
        subject: subject,
        message: snippet,
        time: date,
        read: true,
        starred: false,
        important: false,
        hasAttachments: false,
        labels: [],
        folder: 0,
      };

      return messageObj;
    }))
    .catch(err => console.log(err));

    res.json(resMessages);

  });

  router.get('/labels', (req, res) => {
    // gmail.users.labels.list({ userId: 'jbawtinheimer@gmail.com' }, (error, response) => {
    //   if (error) {
    //     console.log(error);
    //     return;
    //   }
    //   console.log(response.data);
    // });
  });

  router.get('/filters', (req, res) => {
    // get filters eg: starred/important
  })

  router.get('/folders', async (req, res) => {
    const resFolders = [
      {
        id: 0,
        handle: 'inbox',
        title: 'Inbox',
        translate: 'INBOX',
        icon: 'inbox'
      },
      {
        id: 1,
        handle: 'sent',
        title: 'Sent',
        translate: 'SENT',
        icon: 'send'
      },
      {
        id: 2,
        handle: 'draft',
        title: 'Drafts',
        translate: 'DRAFTS',
        icon: 'email_open'
      },
      {
        id: 3,
        handle: 'spam',
        title: 'Spam',
        translate: 'SPAM',
        icon: 'error'
      },
      {
        id: 4,
        handle: 'trash',
        title: 'Trash',
        translate: 'TRASH',
        icon: 'delete'
      }
    ];
    res.json(resFolders);
  });

  router.get('/mail', (req, res) => {
    const { folderHandle, mailId } = req.query;

    gmail.users.messages.get({ userId: 'jbawtinheimer@gmail.com', id: mailId }, (error, response) => {
      if (error) {
        console.log(error);
        return;
      }

      const htmlPart = response.data.payload.parts.filter((part) => {
        return part.mimeType == 'multipart/alternative';
      });

      const txtPart = response.data.payload.parts.filter((part) => {
        return part.mimeType == 'text/html';
      });

      const html = htmlPart.length > 0 ? atob(htmlPart[0].parts[1].body.data.replace(/-/g, '+').replace(/_/g, '/')) : null;
      const txt = txtPart.length > 0 ? atob(txtPart[0].body.data.replace(/-/g, '+').replace(/_/g, '/')) : null;

      const msg = html !== null ? html : txt !== null ? txt : 'No Content Available';
      const date = extractField(response, 'Date');
      const subject = extractField(response, 'Subject');
      const from = extractField(response, 'From');
      const to = extractField(response, 'Delivered-To');
      // need to fix attachment errors
      const resEmail = {
        id: mailId,
        from: {
          name: from,
          avatar: null,
          email: from
        },
        to: [
          {
            name: 'me',
            email: to,
          }
        ],
        subject: subject,
        message: msg,
        time: date,
        read: true,
        starred: false,
        important: false,
        hasAttachments: false,
        labels: [],
        folder: 0,
      }

      res.json(resEmail);

    });

    
  });

  return router;

};