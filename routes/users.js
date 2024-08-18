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

// Endpoint to get top songs
router.get('/top-songs', async (req, res) => {
    try {
      const users = await User.find();
  
      const songCounts = {};
      const originalTitles = {}; // Map to store original titles
  
      users.forEach(user => {
        // Count songs in top 13 lists
        user.rankings.topThirteen.forEach(song => {
          const originalTitle = song.songTitle ? song.songTitle.trim() : '';
          const normalizedTitle = originalTitle.toLowerCase();
          if (normalizedTitle) {
            songCounts[normalizedTitle] = (songCounts[normalizedTitle] || 0) + 1;
            // Store the original title for display purposes
            if (!originalTitles[normalizedTitle]) {
              originalTitles[normalizedTitle] = originalTitle;
            }
          }
        });
  
        // Count songs in eras tour set lists
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
          title: originalTitles[normalizedTitle], // Use the original title for display
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Limit to top 20
  
      res.json(sortedSongs);
    } catch (error) {
      console.error('Error fetching top songs:', error);
      res.status(500).json({ message: 'Error fetching top songs', error: error.message });
    }
  });

module.exports = router;