const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');

// Get user's top 13 list
router.get('/user/top-thirteen', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).populate('rankings.topThirteen.albumId');
      const sortedTopThirteen = user.rankings.topThirteen.sort((a, b) => a.slot - b.slot);
      res.json(sortedTopThirteen);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add or update a song in the top 13 list
 router.post('/user/top-thirteen', authenticateJWT, async (req, res) => {
    const { slot, albumId, songTitle } = req.body;
  
    try {
      const user = await User.findById(req.user.userId);
      if (!user.rankings) {
        user.rankings = { topThirteen: [] };
      }
      const song = user.rankings.topThirteen.find(item => item.slot === slot);
  
      if (song) {
        song.albumId = albumId;
        song.songTitle = songTitle;
      } else {
        user.rankings.topThirteen.push({ slot, albumId, songTitle });
      }
  
      await user.save();
      res.json(user.rankings.topThirteen);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Remove a song from the top 13 list
 router.delete('/user/top-thirteen/:slot', authenticateJWT, async (req, res) => {
    const slot = parseInt(req.params.slot);
  
    try {
      const user = await User.findById(req.user.userId);
      if (user.rankings && user.rankings.topThirteen) {
        user.rankings.topThirteen = user.rankings.topThirteen.filter(item => item.slot !== slot);
        await user.save();
      }
      res.json(user.rankings.topThirteen);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get user rankings
 router.get('/rankings', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('rankings');
      res.json(user.rankings);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  
  // Update a specific ranking list
router.put('/rankings/:listName', authenticateJWT, async (req, res) => {
    const { listName } = req.params;
    const { rankings } = req.body;
  
    try {
      let user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (!user.rankings) {
        user.rankings = {};
      }
  
      if (listName === 'topThirteen') {
        user.rankings.topThirteen = rankings;
      } else {
        if (!user.rankings.albumRankings) {
          user.rankings.albumRankings = {};
        }
        user.rankings.albumRankings[listName] = rankings;
      }
  
      await user.save();
  
      res.json(user.rankings);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  module.exports = router;