const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth'); 


//Endpoint to get how many times a user has logged in
router.get('/logins', authenticateJWT, async (req, res) => {
    try {
        const users = await User.find().select('username loginCount');
        res.json(users);
    } catch (error) {
        console.error('Error fetching user logins:', error);
        res.status(500).json({ message: 'Error fetching user logins', error: error.message });
    }
});

// Endpoint to get top user favorite songs
router.get('/top-favorite-songs', async (req, res) => {
  try {
    const users = await User.find();
    const songCounts = {};
    const originalTitles = {};

    users.forEach(user => {
      user.rankings.topThirteen.forEach(song => {
        const originalTitle = song.songTitle ? song.songTitle.trim() : '';
        const normalizedTitle = originalTitle.toLowerCase();
        if (normalizedTitle) {
          songCounts[normalizedTitle] = (songCounts[normalizedTitle] || 0) + 1;
          if (!originalTitles[normalizedTitle]) {
            originalTitles[normalizedTitle] = originalTitle;
          }
        }
      });
    });

    const sortedSongs = Object.entries(songCounts)
      .map(([normalizedTitle, count]) => ({
        title: originalTitles[normalizedTitle],
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    res.json(sortedSongs);
  } catch (error) {
    console.error('Error fetching top favorite songs:', error);
    res.status(500).json({ message: 'Error fetching top favorite songs', error: error.message });
  }
});

// Endpoint to get popular Eras Tour songs
router.get('/popular-eras-tour-songs', async (req, res) => {
  try {
    const users = await User.find();
    const songCounts = {};
    const originalTitles = {};

    users.forEach(user => {
      user.erasTourSetList.forEach(setList => {
        setList.songs.forEach(song => {
          const originalTitle = song.title ? song.title.trim() : '';
          const normalizedTitle = originalTitle.toLowerCase();
          if (normalizedTitle) {
            songCounts[normalizedTitle] = (songCounts[normalizedTitle] || 0) + 1;
            if (!originalTitles[normalizedTitle]) {
              originalTitles[normalizedTitle] = originalTitle;
            }
          }
        });
      });
    });

    const sortedSongs = Object.entries(songCounts)
      .map(([normalizedTitle, count]) => ({
        title: originalTitles[normalizedTitle],
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    res.json(sortedSongs);
  } catch (error) {
    console.error('Error fetching popular Eras Tour songs:', error);
    res.status(500).json({ message: 'Error fetching popular Eras Tour songs', error: error.message });
  }
});

module.exports = router;