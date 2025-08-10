const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
require('dotenv').config();

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

async function sendEmail(to, subject, htmlBody) {
  console.log('=== EMAIL DEBUG START ===');
  console.log('Sending email to:', to);
  console.log('Subject:', subject);
  console.log('API Key present:', !!process.env.MAILERSEND_API_KEY);
  console.log('API Key first 10 chars:', process.env.MAILERSEND_API_KEY?.substring(0, 10));
  
  const sentFrom = new Sender("noreply@swiftierankinghub.com", "Swiftie Ranking Hub");
  const recipients = [new Recipient(to, "User")];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject)
    .setHtml(htmlBody);

  try {
    console.log('Attempting to send email...');
    const response = await mailerSend.email.send(emailParams);
    console.log('Email sent successfully with MailerSend:', response);
    console.log('=== EMAIL DEBUG END ===');
    return true;
  } catch (error) {
    console.error('=== EMAIL ERROR ===');
    console.error('Error sending email with MailerSend:', error);
    console.error('Error details:', error.response?.data || error.message);
    console.error('=== EMAIL ERROR END ===');
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

function getPasswordResetTemplate(resetUrl) {
  return `
    <h1>Swiftie Ranking Hub Password Reset Request</h1>
    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;
}

function getNewUserNotificationTemplate(name, email) {
  return `
    <h1>New User Registered</h1>
    <p>A new user has registered on Swiftie Ranking Hub:</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
  `;
}

module.exports = {
  sendEmail,
  getWelcomeEmailTemplate,
  getContactFormEmailTemplate,
  getPasswordResetTemplate,
  getNewUserNotificationTemplate
};