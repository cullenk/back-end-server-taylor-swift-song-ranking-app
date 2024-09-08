const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../myModels/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail, getWelcomeEmailTemplate } = require('../services/emailService');

// User sign-up endpoint and behavior
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document in MongoDB
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Attempt to send welcome email
        const htmlBody = getWelcomeEmailTemplate(username);
        const emailSent = await sendEmail(email, 'Welcome to Swiftie Ranking Hub!', htmlBody);

        if (emailSent) {
            res.status(201).json({ message: 'User created successfully and welcome email sent' });
        } else {
            res.status(201).json({ 
                message: 'User created successfully, but there was an issue sending the welcome email',
                emailSent: false
            });
        }
    } catch (error) {
        console.error('Sign Up Error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// User login if account already created
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }]
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        user.loginCount += 1;
        await user.save();

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password is incorrect' });
        }

        const token = jwt.sign(
            { username: user.username, userId: user._id },
            process.env.JWT_SECRET || 'default_secret', // Use the environment variable
            { expiresIn: '1h' }
        );

        res.status(200).json({
            token: token,
            expiresIn: 3600,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error with authentication', error: error.message });
    }
});

//Forgot Password Endpoint
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Generate a password reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
  
      // Send password reset email
      const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;
      const emailBody = `
        <h1>Swiftie Ranking Hub Password Reset Request</h1>
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `;
  
      await sendEmail(email, 'Password Reset', emailBody);
  
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Error in forgot password process' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
      }
  
      // Set the new password
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.json({ message: 'Password has been reset' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

module.exports = router;     


