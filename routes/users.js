const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const express = require('express');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');

// Endpoint to get how many times a user has logged in
router.get('/logins', authenticateJWT, async (req, res) => {
    try {
        let users = myCache.get("user-logins");
        if (users == undefined) {
            users = await User.find().select('username loginCount');
            myCache.set("user-logins", users, 600); // Cache for 10 minutes
        }
        res.json(users);
    } catch (error) {
        console.error('Error fetching user logins:', error);
        res.status(500).json({ message: 'Error fetching user logins', error: error.message });
    }
});

// Endpoint to get top user favorite songs
router.get('/top-favorite-songs', async (req, res) => {
  try {
      let sortedSongs = myCache.get("top-favorite-songs");
      if (sortedSongs == undefined) {
          const pipeline = [
              { $unwind: "$rankings.topThirteen" },
              { $group: {
                  _id: { $toLower: "$rankings.topThirteen.songTitle" },
                  originalTitle: { $first: "$rankings.topThirteen.songTitle" },
                  count: { $sum: 1 }
              }},
              { $sort: { count: -1 } },
              { $project: {
                  _id: 0,
                  title: "$originalTitle",
                  count: 1
              }}
          ];
          sortedSongs = await User.aggregate(pipeline);
          sortedSongs = sortedSongs.slice(0, 25); // Limit to top 25 after aggregation
          myCache.set("top-favorite-songs", sortedSongs, 3600); // Cache for 1 hour
      }
      res.json(sortedSongs);
  } catch (error) {
      console.error('Error fetching top favorite songs:', error);
      res.status(500).json({ message: 'Error fetching top favorite songs', error: error.message });
  }
});

// Endpoint to get popular Eras Tour songs
router.get('/popular-eras-tour-songs', async (req, res) => {
  try {
      let sortedSongs = myCache.get("popular-eras-tour-songs");
      if (sortedSongs == undefined) {
          const pipeline = [
              { $unwind: "$erasTourSetList" },
              { $unwind: "$erasTourSetList.songs" },
              { $group: {
                  _id: { $toLower: "$erasTourSetList.songs.title" },
                  originalTitle: { $first: "$erasTourSetList.songs.title" },
                  count: { $sum: 1 }
              }},
              { $sort: { count: -1 } },
              { $project: {
                  _id: 0,
                  title: "$originalTitle",
                  count: 1
              }}
          ];
          sortedSongs = await User.aggregate(pipeline);
          sortedSongs = sortedSongs.slice(0, 25); // Limit to top 25 after aggregation
          myCache.set("popular-eras-tour-songs", sortedSongs, 3600); // Cache for 1 hour
      }
      res.json(sortedSongs);
  } catch (error) {
      console.error('Error fetching popular Eras Tour songs:', error);
      res.status(500).json({ message: 'Error fetching popular Eras Tour songs', error: error.message });
  }
});

module.exports = router;