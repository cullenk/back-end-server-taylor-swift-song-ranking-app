// I don't think use this any more
const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

async function sendEmail(to, subject, htmlBody) {
  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Charset: "UTF-8", Data: htmlBody } },
      Subject: { Charset: "UTF-8", Data: subject }
    },
    Source: process.env.SES_EMAIL_SOURCE
  };

  try {
    await ses.sendEmail(params).promise();
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

function getWelcomeEmailTemplate(username) {
  return `
    <h1>Welcome, ${username}!</h1>
    <p>Thank you for joining Swiftie Ranking Hub. We're excited to have you on board!</p>
    <p>Start ranking your favorite Taylor Swift songs and albums now!</p>
  `;
}

function getContactFormEmailTemplate(name, email, message) {
  return `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong> ${message}</p>
  `;
}

module.exports = {
  sendEmail,
  getWelcomeEmailTemplate,
  getContactFormEmailTemplate
};