const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');

// Get user profile
router.get('/user-profile', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
});

// Update profile Image
router.put('/image', authenticateJWT, async (req, res) => {
    try {
      const { image } = req.body;
      const user = await User.findByIdAndUpdate(req.user.id, { profileImage: image }, { new: true });
      res.json({ message: 'Profile image updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile image', error: error.message });
    }
  });

// Update theme
router.put('/theme', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { theme: req.body.theme },
            { new: true }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ message: 'Error updating theme', error: error.message });
    }
});

// Update profile questions
router.put('/questions', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profileQuestions: req.body.questions },
            { new: true }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error updating profile questions:', error);
        res.status(500).json({ message: 'Error updating profile questions', error: error.message });
    }
});

// Sharing a user profile publicly
router.get('/public-profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password -email');
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
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Error fetching public profile', error: error.message });
    }
});

// Get eras tour set list by username
router.get('/eras-tour-set-list/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('erasTourSetList');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.erasTourSetList);
    } catch (error) {
        console.error('Error fetching eras tour set list:', error);
        res.status(500).json({ message: 'Error fetching eras tour set list', error: error.message });
    }
});

module.exports = router;
