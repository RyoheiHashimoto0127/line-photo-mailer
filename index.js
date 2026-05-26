require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const { Resend } = require('resend');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const resend = new Resend(process.env.RESEND_API_KEY);

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

        await axios.get(
          `https://api-data.line.me/v2/bot/message/${messageId}/content`,
          {
            responseType: 'arraybuffer',
            headers: {
              Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
          }
        );

        console.log('Image fetched from LINE');
        console.log('TO_EMAIL_1:', process.env.TO_EMAIL_1);
        console.log('TO_EMAIL_2:', process.env.TO_EMAIL_2);
        console.log('Sending email with Resend...');

        const result = await resend.emails.send({
          from: 'Acme <onboarding@resend.dev>',
          to: [process.env.TO_EMAIL_1, process.env.TO_EMAIL_2].filter(Boolean),
          subject: '写真受信',
          text: 'LINEから写真が送信されました。',
        });

        console.log('Resend result:', JSON.stringify(result, null, 2));

        if (result.error) {
          console.error('Resend error:', result.error);
        } else {
          console.log('Email sent successfully');
        }
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