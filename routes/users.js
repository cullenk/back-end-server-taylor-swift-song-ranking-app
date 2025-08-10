const express = require('express');
const NodeCache = require('node-cache');
const router = express.Router();
const User = require('../myModels/userModel');
const authenticateJWT = require('../middleware/auth');

const myCache = new NodeCache();

// Endpoint to get how many times a user has logged in
router.get('/logins', authenticateJWT, async (req, res) => {
    try {
        
        let users = myCache.get("user-logins");
        if (users == undefined) {
            console.log('Cache miss, fetching from database');
            const usersFromDB = await User.find().select('username loginCount');
            
            // Convert Mongoose documents to plain objects before caching
            users = usersFromDB.map(user => ({
                username: user.username,
                loginCount: user.loginCount
            }));
            
            myCache.set("user-logins", users, 600); // Cache for 10 minutes
        } else {
            console.log('Cache hit, returning cached data');
        }
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching user logins:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Error fetching user logins', error: error.message });
    }
});

// Endpoint to get top user favorite songs
router.get('/top-favorite-songs', async (req, res) => {
    try {
        let sortedSongs = myCache.get("top-favorite-songs");
        if (sortedSongs == undefined) {
            console.log('Cache miss, fetching from database');
            const users = await User.find().select('rankings');
            
            const songCounts = {};
            users.forEach(user => {
                // Check topThirteen rankings - these are the user's favorite songs
                if (user.rankings && user.rankings.topThirteen) {
                    user.rankings.topThirteen.forEach(song => {
                        if (song.songTitle && song.songTitle.trim() !== '') {
                            songCounts[song.songTitle] = (songCounts[song.songTitle] || 0) + 1;
                        }
                    });
                }
            });


            // Convert to plain objects before caching
            sortedSongs = Object.entries(songCounts)
                .map(([title, count]) => ({ title, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);

            myCache.set("top-favorite-songs", sortedSongs, 600);
        } else {
            console.log('Cache hit, returning cached data');
        }
        
        res.json(sortedSongs);
    } catch (error) {
        console.error('Error fetching top favorite songs:', error);
        res.status(500).json({ message: 'Error fetching top favorite songs', error: error.message });
    }
});

// Endpoint to get ALL user favorite songs (no limit for dedicated page)
router.get('/all-top-favorite-songs', authenticateJWT, async (req, res) => {
    try {
        let allSortedSongs = myCache.get("all-top-favorite-songs");
        if (allSortedSongs == undefined) {
            console.log('Cache miss, fetching all favorite songs from database');
            const users = await User.find().select('rankings');
            
            const songCounts = {};
            users.forEach(user => {
                // Check topThirteen rankings - these are the user's favorite songs
                if (user.rankings && user.rankings.topThirteen) {
                    user.rankings.topThirteen.forEach(song => {
                        if (song.songTitle && song.songTitle.trim() !== '') {
                            songCounts[song.songTitle] = (songCounts[song.songTitle] || 0) + 1;
                        }
                    });
                }
            });


            // Convert to plain objects before caching - NO LIMIT for all songs
            allSortedSongs = Object.entries(songCounts)
                .map(([title, count]) => ({ title, count }))
                .sort((a, b) => b.count - a.count);

            myCache.set("all-top-favorite-songs", allSortedSongs, 600); // Cache for 10 minutes
        } else {
            console.log('Cache hit, returning cached all favorite songs data');
        }
        
        res.json(allSortedSongs);
    } catch (error) {
        console.error('Error fetching all top favorite songs:', error);
        res.status(500).json({ message: 'Error fetching all top favorite songs', error: error.message });
    }
});

// Endpoint to get popular Eras Tour songs
router.get('/popular-eras-tour-songs', async (req, res) => {
    try {
        let sortedSongs = myCache.get("popular-eras-tour-songs");
        if (sortedSongs == undefined) {
            console.log('Cache miss, fetching from database');
            const users = await User.find().select('erasTourSetList');
            
            const songCounts = {};
            users.forEach(user => {
                if (user.erasTourSetList && Array.isArray(user.erasTourSetList)) {
                    user.erasTourSetList.forEach(era => {
                        if (era.songs && Array.isArray(era.songs)) {
                            era.songs.forEach(song => {
                                if (song.title) {
                                    songCounts[song.title] = (songCounts[song.title] || 0) + 1;
                                }
                            });
                        }
                    });
                }
            });

            // Convert to plain objects before caching
            sortedSongs = Object.entries(songCounts)
                .map(([title, count]) => ({ title, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);

            myCache.set("popular-eras-tour-songs", sortedSongs, 600);
        } else {
            console.log('Cache hit, returning cached data');
        }
        
        res.json(sortedSongs);
    } catch (error) {
        console.error('Error fetching popular Eras Tour songs:', error);
        res.status(500).json({ message: 'Error fetching popular Eras Tour songs', error: error.message });
    }
});

module.exports = router;