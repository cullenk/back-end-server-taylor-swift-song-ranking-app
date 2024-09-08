// routes/sendMail.js
const express = require('express');
const router = express.Router();
const { sendEmail, getWelcomeEmailTemplate, getContactFormEmailTemplate } = require('../services/emailService');

router.post('/send-welcome-email', async (req, res) => {
  const { email, username } = req.body;
  
  try {
    const htmlBody = getWelcomeEmailTemplate(username);
    const success = await sendEmail(email, 'Welcome to The Swiftie Ranking Hub!', htmlBody);
    
    if (success) {
      res.status(200).json({ message: 'Welcome email sent successfully' });
    } else {
      res.status(500).json({ message: 'Error sending welcome email' });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ message: 'Error sending welcome email' });
  }
});

router.post('/send-contact-form', async (req, res) => {
  const { name, email, message } = req.body;
  
  try {
    const htmlBody = getContactFormEmailTemplate(name, email, message);
    const success = await sendEmail('swiftierankinghub@gmail.com', 'Swiftie Ranking Hub Form Submission', htmlBody);
    
    if (success) {
      res.status(200).json({ message: 'Contact form email sent successfully' });
    } else {
      res.status(500).json({ message: 'Error sending contact form email' });
    }
  } catch (error) {
    console.error('Error sending contact form email:', error);
    res.status(500).json({ message: 'Error sending contact form email' });
  }
});

module.exports = router;