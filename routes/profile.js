const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');

// Get user profile
router.get('/user-profile', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update theme
router.put('/theme', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { theme: req.body.theme },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update profile questions
  router.put('/questions', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { profileQuestions: req.body.questions },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  //Sharing a user profile publicly 
  router.get('/public-profile/:username', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Only send non-sensitive, public information
      const publicProfile = {
        username: user.username,
        rankings: user.rankings,
        theme: user.theme,
        profileQuestions: user.profileQuestions
      };
      
      res.json(publicProfile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  module.exports = router;