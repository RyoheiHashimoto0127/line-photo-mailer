
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

app.get('/', (req, res) => {
  res.send('OK');
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    console.log('Webhook received');

    const events = req.body.events || [];
    console.log('Events count:', events.length);

    for (const event of events) {
      console.log('Event type:', event.type);

      if (event.type === 'message' && event.message.type === 'image') {
        console.log('Image message received');

        const messageId = event.message.id;
        console.log('messageId:', messageId);

        const response = await axios.get(
          `https://api-data.line.me/v2/bot/message/${messageId}/content`,
          {
            responseType: 'arraybuffer',
            headers: {
              Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
          }
        );

        console.log('Image fetched from LINE');

        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT),
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        console.log('Sending email...');

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

        console.log('Email sent successfully');
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('ERROR OCCURRED:');
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('OK');
});