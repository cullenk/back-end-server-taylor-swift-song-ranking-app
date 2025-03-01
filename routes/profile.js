const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');
const sanitizeHtml = require('sanitize-html');

// Get user profile
router.get('/user-profile', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    //   console.log('Sending user profile:', user);
      res.json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
  });


// Update profile Image
router.put('/image', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: { profileImage: req.body.image } },
            { new: true, upsert: true }
        ).select('-password');

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating profile image:', error);
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
        const sanitizedQuestions = req.body.questions.map(q => ({
            question: sanitizeHtml(q.question),
            answer: sanitizeHtml(q.answer, {
                allowedTags: [], // Allow no HTML tags
                allowedAttributes: {} // Allow no HTML attributes
            })
        }));

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profileQuestions: sanitizedQuestions },
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
  
      const publicProfile = {
        username: user.username,
        rankings: user.rankings,
        theme: user.theme,
        profileImage: user.profileImage, 
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

//Check if user has completed/verified their dream Eras Tour yet
router.get('/:username/has-completed-eras-tour', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if the user has a non-empty erasTourSetList
        const hasCompletedSetlist = user.erasTourSetList && user.erasTourSetList.length > 0;
        
        res.json({ hasCompletedSetlist });
    } catch (error) {
        console.error('Error checking Eras Tour setlist:', error);
        res.status(500).json({ message: 'Error checking Eras Tour setlist', error: error.message });
    }
});

// Get all public profiles with pagination and filtering
router.get('/all-public-profiles', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
  
      // Find users who have chosen a profile image, theme and top 13 songs only
      const users = await User.find({
        profileImage: { $exists: true, $ne: '' },
        theme: { $exists: true, $ne: '' },
        'rankings.topThirteen': { $exists: true, $ne: [] }
      })
      .sort({ _id: -1 }) // Sort by _id descending (newest first)
      .skip(skip)
      .limit(limit)
      .select('username profileImage theme');
  
      const totalCount = await User.countDocuments({
        profileImage: { $exists: true, $ne: '' },
        theme: { $exists: true, $ne: '' },
        'rankings.topThirteen': { $exists: true, $ne: [] }
      });
  
      res.json({
        totalCount,
        users,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching all public profiles:', error);
      res.status(500).json({ message: 'Error fetching public profiles', error: error.message });
    }
  });
  
// Get all public profiles without pagination for global search
router.get('/all-public-profiles/all', async (req, res) => {
  try {
      const users = await User.find({
          profileImage: { $exists: true, $ne: '' },
          theme: { $exists: true, $ne: '' }
      }).select('username profileImage theme');

      res.json(users);
  } catch (error) {
      console.error('Error fetching all public profiles:', error);
      res.status(500).json({ message: 'Error fetching public profiles', error: error.message });
  }
});

module.exports = router;

