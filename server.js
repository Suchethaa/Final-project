const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Collaboration Tools Integration');
});

app.post('/slack', async (req, res) => {
    const message = req.body.message;
    const response = await axios.post('https://slack.com/api/chat.postMessage', {
        channel: '#social', //must be same as the channels created
        text: message
    }, {
        headers: {
            Authorization: `Bearer ${process.env.SLACK_TOKEN}`
        }
    });
    res.send(response.data);
});

app.post('/trello', async (req, res) => {
    const { name, desc } = req.body;
    const response = await axios.post(`https://api.trello.com/1/cards?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`, {
        name: name,
        desc: desc,
        idList: process.env.TRELLO_LIST_ID
    });
    res.send(response.data);
});

app.post('/drive', async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, 'credentials.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: 'asibdoc.txt',
        };

        const media = {
            mimeType: 'text/plain',
            body: fs.createReadStream(path.join(__dirname, 'asibdoc.txt')),
        };

        const uploadResponse = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        const fileId = uploadResponse.data.id;

        const permission = {
            type: 'anyone',
            role: 'reader', 
        };

        await drive.permissions.create({
            fileId: fileId,
            resource: permission,
            fields: 'id',
        });

        const fileDetails = await drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink',
        });

        res.send({
            message: 'File uploaded and made public successfully!',
            fileId: fileId,
            publicUrl: fileDetails.data.webViewLink,
            downloadUrl: fileDetails.data.webContentLink,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});