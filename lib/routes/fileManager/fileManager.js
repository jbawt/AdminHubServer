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

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

module.exports = (db) => {

  router.get('/files', async (req, res) => {

    const driveFiles = await drive.files.list({ q: "trashed=false and 'root' in parents", fields: 'files(id, name, size, modifiedTime, mimeType, createdTime, owners, fileExtension, thumbnailLink, webViewLink)' });
    const resFiles = [];

    const files = driveFiles.data.files.map(file => {

      const fileTypeArr = file.mimeType.split("/")[1].split(".");
      let fileType = fileTypeArr[fileTypeArr.length - 1];

      if (fileType === 'script' || fileType === 'mp4' || fileType === 'mpeg' || fileType === 'amr' || fileType === 'mxfile') {

        return null;
  
      } else {

        if (fileType === 'sheet') {
          fileType = 'spreadsheet';
        } else if (fileType === 'pdf' || fileType === 'text') {
          fileType = 'document';
        }

        if (file.size) {
          const bytes = parseInt(file.size);

          if (bytes > 1000000) {
            file.size = `${Number.parseFloat(bytes / 1000000).toFixed(1)}Mb`;
          } else {
            file.size = `${Math.ceil(bytes / 1000)}Kb`;
          }

        };

        return {
          id: file.id,
          type: fileType,
          name: file.name,
          owner: file.owners[0].displayName,
          size: file.size ? file.size : '',
          modified: new Date(file.modifiedTime).toDateString(),
          opened: '',
          created: new Date(file.createdTime).toDateString(),
          extention: file.fileExtension ? file.fileExtension : '',
          location: 'My Files > Documents',
          offline: true,
          preview: file.thumbnailLink ? file.thumbnailLink : '',
          webViewLink: file.webViewLink,
        };

      };

    });

    files.forEach(file => {
      if (file !== null) {
        if (file.type === 'folder') {
          resFiles.unshift(file);
        } else {
          resFiles.push(file);
        };
      };
    });

    res.json(resFiles);

  });

  return router;

};