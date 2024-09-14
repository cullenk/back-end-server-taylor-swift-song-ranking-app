const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

router.post('/sendMail', async (req, res) => {
    try {
        await emailController.sendEmail(req.body);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email', details: error.message });
    }
});

module.exports = router;