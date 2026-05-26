require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'image') {
      const messageId = event.message.id;

      const response = await axios.get(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
        }
      );

      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: process.env.TO_EMAIL_1,
        cc: process.env.TO_EMAIL_2,
        subject: '写真受信',
        text: '写真が送られてきました',
        attachments: [
          {
            filename: 'photo.jpg',
            content: Buffer.from(response.data),
          },
        ],
      });
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('OK');
});