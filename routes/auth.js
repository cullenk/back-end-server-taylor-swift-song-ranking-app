const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User sign-up endpoint and behavior

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user document in MongoDB
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();
  
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Sign Up Error:', error);
        res.status(500).json({ message: 'Error with authentication', error: error.message });
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
      
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Password is incorrect' });
      }
  
      const token = jwt.sign(
        {username: user.username, userId: user._id},
        "secret_string",
        {expiresIn: "1h"}
      );
  
      res.status(200).json({
        token: token,
        expiresIn: 3600
      });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error with authentication', error: error.message });
      }
  });
  
  module.exports = router;