require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const bcrypt = require('bcrypt');

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        // Store the new refresh token
        process.env.GMAIL_REFRESH_TOKEN = tokens.refresh_token;
      }
    console.log('New or refreshed tokens:', tokens);
  });

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  scope: 'https://www.googleapis.com/auth/gmail.send'
});

// Forgot Password Behavior
router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Received email:', email);

      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('User found:', user);

      // Generate a password reset token
      const token = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
  
      await user.save();
  
      // Get access token
      const accessToken = await oauth2Client.getAccessToken();
      console.log('Access token:', accessToken);
      // Send email with reset link
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken
        }
      });
  
      const mailOptions = {
        to: user.email,
        from: process.env.GMAIL_USER,
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset-password/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error getting access token:', error);
      console.error('Error in forgot password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
      }
  
      // Set the new password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await user.save();
  
      res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
      console.error('Error in reset password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
