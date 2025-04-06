// scripts/test-twilio.js
require('dotenv').config(); // לטעינת משתני הסביבה

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: JSON.stringify({
            "1": "12/1",
            "2": "3pm"
        }),
        to: 'whatsapp:+972543210040' // שים לב לשנות למספר שלך
    })
    .then(message => console.log(`Message sent successfully! SID: ${message.sid}`))
    .catch(err => console.error(`Error sending WhatsApp message: ${err}`));