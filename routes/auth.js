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

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
          message: 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores.'
      });
  }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
        });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document in MongoDB
        const newUser = new User({ username, email: lowercaseEmail, password: hashedPassword });
        await newUser.save();

        // // Send welcome email
        // try {
        //     await sendEmail({
        //         to: email,
        //         name: username,
        //         type: 'welcome'
        //     });
        // } catch (emailError) {
        //     console.error('Error sending welcome email:', emailError);
        //     // Don't return here, continue with the signup process
        // }

        // Send notification email to admin
        try {
            await sendEmail({
                to: 'swiftierankinghub@gmail.com',
                type: 'newUser',
                name: username,
                email: email
            });
        } catch (adminEmailError) {
            console.error('Error sending admin notification email:', adminEmailError);
            // Don't return here, continue with the signup process
        }

        // User created successfully
        res.status(201).json({ 
            message: 'Account created successfully, check your email for a welcome message!',
            userId: newUser._id // Optionally send back the user ID
        });

    } catch (error) {
        console.error('Sign Up Error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
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


