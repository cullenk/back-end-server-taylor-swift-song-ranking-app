const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');
const sanitizeHtml = require('sanitize-html');
const countries = require('../utils/countries');

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
// Update the public profile endpoint
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
            profileQuestions: user.profileQuestions,
            loginCount: user.loginCount,
            country: user.country, 
        };

        res.json(publicProfile);
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Error fetching public profile', error: error.message });
    }
});

// Get all public profiles with pagination and filtering
router.get('/all-public-profiles', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find({
            // Has items in topThirteen list
            'rankings.topThirteen': { $exists: true, $ne: [] },
            // Has albumRankings set (check if allAlbums exists and is not empty)
            'rankings.albumRankings.allAlbums': { $exists: true, $ne: [] }
        })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .select('username profileImage theme country');

        const totalCount = await User.countDocuments({
            theme: { $exists: true, $ne: '', $ne: 'default' },
            'rankings.topThirteen': { $exists: true, $ne: [] },
            'rankings.albumRankings.allAlbums': { $exists: true, $ne: [] }
        });

        const transformedUsers = users.map(user => ({
            username: user.username,
            profileImage: user.profileImage ? user.profileImage : 'https://d3e29z0m37b0un.cloudfront.net/profile-images/debut.webp', 
            theme: user.theme,
            country: user.country,
        }));

        res.json({
            totalCount,
            users: transformedUsers,
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
            // Has a selected theme (not default/empty)
            theme: { $exists: true, $ne: '', $ne: 'default' },
            // Has items in topThirteen list
            'rankings.topThirteen': { $exists: true, $ne: [] },
            // Has albumRankings set (check if allAlbums exists and is not empty)
            'rankings.albumRankings.allAlbums': { $exists: true, $ne: [] }
        }).select('username profileImage theme country');

        res.json(users);
    } catch (error) {
        console.error('Error fetching all public profiles:', error);
        res.status(500).json({ message: 'Error fetching public profiles', error: error.message });
    }
});

// Get list of available countries
router.get('/countries', async (req, res) => {
    try {
        res.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Error fetching countries', error: error.message });
    }
});

// Update user country (with validation)
router.put('/country', authenticateJWT, async (req, res) => {
    try {
        const { country } = req.body;

        // Validate country selection
        if (country && !countries.includes(country)) {
            return res.status(400).json({
                message: 'Invalid country selection. Please choose from the provided list.'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { country: country || null }, // Allow setting to null to remove
            { new: true, runValidators: true } // Enable mongoose validation
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating country:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                error: error.message
            });
        }

        res.status(500).json({ message: 'Error updating country', error: error.message });
    }
});


// Enhanced country statistics
router.get('/country-stats', async (req, res) => {
    try {
        const countryStats = await User.aggregate([
            {
                $match: {
                    country: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$country',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    country: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get total users with countries set
        const totalUsersWithCountry = countryStats.reduce((sum, stat) => sum + stat.count, 0);

        // Calculate percentages
        const statsWithPercentages = countryStats.map(stat => ({
            ...stat,
            percentage: ((stat.count / totalUsersWithCountry) * 100).toFixed(1)
        }));

        res.json({
            totalUsersWithCountry,
            countries: statsWithPercentages
        });
    } catch (error) {
        console.error('Error fetching country stats:', error);
        res.status(500).json({ message: 'Error fetching country stats', error: error.message });
    }
});


module.exports = router;

