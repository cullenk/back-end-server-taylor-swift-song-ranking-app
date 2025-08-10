const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../myModels/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../controllers/email.controller');

// User sign-up endpoint and behavior
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const lowercaseEmail = email.toLowerCase();

     console.log('=== SIGNUP ROUTE HIT ===');
    console.log('Signup attempt for username:', username);
    console.log('Email:', lowercaseEmail);

    try {
        // Check username availability
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ 
                field: 'username',
                message: 'This username is already taken. Please choose a different one.'
            });
        }

        // Check email availability
        const existingEmail = await User.findOne({ email: lowercaseEmail });
        if (existingEmail) {
            return res.status(400).json({ 
                field: 'email',
                message: 'An account with this email already exists. Please use a different email or try logging in.'
            });
        }

        // Username validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                field: 'username',
                message: 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores.'
            });
        }

        // Password validation
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                field: 'password',
                message: 'Password must be at least 6 characters long and include at least one uppercase letter and one number.'
            });
        }

        // If all checks pass, proceed with user creation
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email: lowercaseEmail, password: hashedPassword });
        await newUser.save();

        // Send notification email to admin
        try {
            console.log('=== SIGNUP EMAIL START ===');
            console.log('About to send new user email notification');
            console.log('Username:', username);
            console.log('Email:', lowercaseEmail);

            const emailResult = await sendEmail({
                to: 'swiftierankinghub@gmail.com',
                type: 'newUser',
                name: username,
                email: lowercaseEmail
            });
            
            console.log('Email function result:', emailResult);
            console.log('Admin notification email sent successfully');
            console.log('=== SIGNUP EMAIL END ===');
        } catch (emailError) {
              console.error('=== SIGNUP EMAIL ERROR ===');
            console.error('Error sending admin notification email:', emailError);
            console.error('=== SIGNUP EMAIL ERROR END ===');
        }

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'An error occurred during signup. Please try again.' });
    }
});

// User login if account already created
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const lowercaseUsername = username.toLowerCase();
        const user = await User.findOne({
            $or: [
                { username: { $regex: new RegExp('^' + lowercaseUsername + '$', 'i') } },
                { email: lowercaseUsername }
            ]
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
    const lowercaseEmail = email.toLowerCase();
  
    try {
        const user = await User.findOne({ email: lowercaseEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        // Generate a password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
  
        // Send password reset email
        await sendEmail({
            to: email,
            type: 'passwordReset',
            resetToken: resetToken
        });
  
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


