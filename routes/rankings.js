const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../myModels/userModel');
const Album = require('../myModels/albumModel');
const authenticateJWT = require('../middleware/auth');

// Get user's top 13 list
router.get('/user/top-thirteen', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('rankings.topThirteen.albumName');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const sortedTopThirteen = user.rankings.topThirteen.sort((a, b) => a.slot - b.slot);
        res.json(sortedTopThirteen);
    } catch (error) {
        console.error('Error fetching top 13 list:', error);
        res.status(500).json({ message: 'Error fetching top 13 list', error: error.message });
    }
});

router.post('/user/top-thirteen', authenticateJWT, async (req, res) => {
    const { slot, albumName, songId, songTitle, albumCover } = req.body;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.rankings) {
            user.rankings = { topThirteen: [] };
        }
        const song = user.rankings.topThirteen.find(item => item.slot === slot);

        if (song) {
            song.albumName = albumName;
            song.songId = songId;
            song.songTitle = songTitle;
            song.albumCover = albumCover;
        } else {
            user.rankings.topThirteen.push({ slot, albumName, songId, songTitle, albumCover });
        }

        await user.save();
        res.json(user.rankings.topThirteen);
    } catch (error) {
        console.error('Error adding/updating top 13 list:', error);
        res.status(500).json({ message: 'Error adding/updating top 13 list', error: error.message });
    }
});

// Remove a song from the top 13 list
router.delete('/user/top-thirteen/:slot', authenticateJWT, async (req, res) => {
    const slot = parseInt(req.params.slot);

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.rankings && user.rankings.topThirteen) {
            user.rankings.topThirteen = user.rankings.topThirteen.filter(item => item.slot !== slot);
            await user.save();
        }
        res.json(user.rankings.topThirteen);
    } catch (error) {
        console.error('Error removing from top 13 list:', error);
        res.status(500).json({ message: 'Error removing from top 13 list', error: error.message });
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


// Update entire top 13 list
router.put('/user/top-thirteen', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate the incoming list
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Invalid top 13 list format' });
        }

        // Validate and filter each item in the list
        const validatedList = req.body
            .filter(item => item.songId && item.songId.trim() !== '') // Filter out items with empty songId
            .map((item, index) => ({
                slot: index + 1, // Reassign slots based on filtered list
                albumName: item.albumName || '',
                songId: item.songId || '',
                songTitle: item.songTitle || '',
                albumCover: item.albumCover || ''
            }));

        // Pad the list with empty slots if less than 13 items
        while (validatedList.length < 13) {
            validatedList.push({
                slot: validatedList.length + 1,
                albumName: '',
                songId: '',
                songTitle: '',
                albumCover: ''
            });
        }

        // Update the user's top 13 list
        user.rankings.topThirteen = validatedList;

        await user.save();

        // Return the updated list
        res.json(user.rankings.topThirteen);
    } catch (error) {
        console.error('Error updating entire top 13 list:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Invalid data in top 13 list', 
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Error updating entire top 13 list', 
            error: error.message 
        });
    }
});

// Update all albums ranking list
router.put('/allAlbumsRanking/allAlbumsRanking', authenticateJWT, async (req, res) => {
    const { rankings } = req.body;
    console.log('Received rankings:', rankings); // Log received rankings

    try {
        let user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!user.rankings) {
            user.rankings = {};
        }

        if (!user.rankings.albumRankings) {
            user.rankings.albumRankings = {};
        }

        user.rankings.albumRankings['allAlbums'] = rankings.map(ranking => ({
            rank: ranking.rank,
            albumName: ranking.albumName,
            albumCover: ranking.albumCover
        }));

        console.log('Saving rankings:', user.rankings.albumRankings['allAlbums']); // Log before saving

        await user.save();

        // Fetch the updated user to ensure data is saved correctly
        user = await User.findById(req.user.userId);

        console.log('Returning updated rankings:', user.rankings.albumRankings['allAlbums']); // Log the response

        res.json(user.rankings.albumRankings['allAlbums']); // Return updated rankings
    } catch (err) {
        console.error('Error:', err.message);
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
            console.log('Dynamic Ranking List Called')
        }

        await user.save();

        res.json(user.rankings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get track rankings
router.get('/track-rankings', authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || !user.rankings || !user.rankings.trackRankings) {
        console.log('Track rankings not found for user');
        return res.json([]); // Return an empty array if no rankings found
      }
      console.log('Sending track rankings:', user.rankings.trackRankings);
      res.json(user.rankings.trackRankings);
    } catch (error) {
      console.error('Error fetching track rankings:', error);
      res.status(500).json({ message: 'Error fetching track rankings', error: error.message });
    }
  });

// Save track rankings
router.put('/track-rankings', authenticateJWT, async (req, res) => {
    const { trackRankings } = req.body;
  
    try {
      let user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (!user.rankings) {
        user.rankings = {};
      }
  
      user.rankings.trackRankings = trackRankings.map(track => 
        track.map(item => ({
          songId: item.songId,
          songTitle: item.songTitle,
          albumName: item.albumName,
          audioSource: item.audioSource,
          albumImageSource: item.albumImageSource,
          rank: item.rank
        }))
      );
  
      await user.save();
  
      res.json(user.rankings.trackRankings);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
//Get All Songs
  router.get('/all-songs', async (req, res) => {
    try {
      const allSongs = await Album.aggregate([
        { $unwind: '$songs' },
        { $project: {
          songId: '$songs._id',
          songTitle: '$songs.title',
          albumName: '$title',
          audioSource: '$songs.audioSource',
          albumImageSource: '$songs.albumImageSource'
        }}
      ]);
      res.json(allSongs);
    } catch (error) {
      console.error('Error fetching all songs:', error);
      res.status(500).json({ message: 'Error fetching all songs', error: error.message });
    }
  });

  // Get all songs ranking
  router.get('/all-songs-ranking', authenticateJWT, async (req, res) => {
    console.log('All songs ranking route hit');
    try {
      const user = await User.findById(req.user.userId);
      if (user && user.rankings && user.rankings.allSongsRanking && user.rankings.allSongsRanking.length > 0) {
        return res.json(user.rankings.allSongsRanking);
      }
  
      // If user has no rankings, create default ranking
      const albums = await Album.find().sort({ releaseYear: 1 });
      let defaultRanking = [];
      let rank = 1;
  
      for (const album of albums) {
        console.log('Album:', album.title, 'Album Cover:', album.albumCover);
        for (const song of album.songs) {
          console.log('Song:', song.title, 'Song Album Cover:', song.albumCover);
            console.log('Song object:', song);
          defaultRanking.push({
            songId: song._id.toString(),
            songTitle: song.title,
            albumName: album.title,
            audioSource: song.audioSource,
            rank: rank++,
            albumImageSource: song.albumImageSource || album.albumCover
          });
        }
      }
  
      // If user exists, save this default ranking
      if (user) {
        user.rankings = user.rankings || {};
        user.rankings.allSongsRanking = defaultRanking;
        await user.save();
      }
      console.log(defaultRanking[3])
      res.json(defaultRanking);
    } catch (error) {
      console.error('Error fetching all songs ranking:', error);
      res.status(500).json({ message: 'Error fetching all songs ranking', error: error.message });
    }
  });
  
  // Save all songs ranking
  router.put('/all-songs-ranking', authenticateJWT, async (req, res) => {
    const { ranking } = req.body;
  
    try {
      let user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (!user.rankings) {
        user.rankings = {};
      }
  
      user.rankings.allSongsRanking = ranking;
  
      await user.save();
  
      res.json(user.rankings.allSongsRanking);
    } catch (err) {
      console.error('Error saving all songs ranking:', err);
      res.status(500).send('Server Error');
    }
  });

// Get Eras Tour Set List
router.get('/eras-tour-set-list', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.erasTourSetList || []);
    } catch (error) {
        console.error('Error fetching Eras Tour set list:', error);
        res.status(500).json({ message: 'Error fetching set list', error: error.message });
    }
});

// Update Eras Tour Set List
router.put('/eras-tour-set-list', authenticateJWT, async (req, res) => {
    try {
        const { erasTourSetList } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert song IDs to ObjectIds and handle empty strings
        erasTourSetList.forEach(era => {
            era.songs = era.songs.map(song => {
                if (song._id && mongoose.Types.ObjectId.isValid(song._id)) {
                    return { ...song, _id: new mongoose.Types.ObjectId(song._id) };
                } else {
                    return { ...song, _id: null };
                }
            });
        });

        user.erasTourSetList = erasTourSetList;
        await user.save();

        res.json(user.erasTourSetList);
    } catch (error) {
        console.error('Error updating Eras Tour set list:', error);
        res.status(500).json({ message: 'Error updating set list', error: error.message });
    }
});

// Get user's top 5 albums
router.get('/user/top-five-albums', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.rankings || !user.rankings.albumRankings || !user.rankings.albumRankings.allAlbums) {
            return res.status(404).json({ message: 'Top albums not found' });
        }
        const topFiveAlbums = user.rankings.albumRankings.allAlbums
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 5);
        res.json(topFiveAlbums);
    } catch (error) {
        console.error('Error fetching top 5 albums:', error);
        res.status(500).json({ message: 'Error fetching top 5 albums', error: error.message });
    }
});

// Get user's top 5 albums (public)
router.get('/user/:username/top-five-albums', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user || !user.rankings || !user.rankings.albumRankings || !user.rankings.albumRankings.allAlbums) {
            return res.status(404).json({ message: 'Top albums not found' });
        }
        const topFiveAlbums = user.rankings.albumRankings.allAlbums
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 5);
        res.json(topFiveAlbums);
    } catch (error) {
        console.error('Error fetching top 5 albums:', error);
        res.status(500).json({ message: 'Error fetching top 5 albums', error: error.message });
    }
});

// In your rankings router file
router.get('/album-popularity', async (req, res) => {
    try {
        const users = await User.find({ 'rankings.albumRankings.allAlbums': { $exists: true } });
        const albumScores = {};

        users.forEach(user => {
            user.rankings.albumRankings.allAlbums.forEach((album, index) => {
                if (!albumScores[album.albumName]) {
                    albumScores[album.albumName] = { score: 0, cover: album.albumCover };
                }
                albumScores[album.albumName].score += (10 - index); // 10 points for 1st, 9 for 2nd, etc.
            });
        });

        const sortedAlbums = Object.entries(albumScores)
            .sort(([,a], [,b]) => b.score - a.score)
            .map(([albumName, data], index) => ({
                rank: index + 1,
                albumName,
                albumCover: data.cover,
                score: data.score
            }));

        res.json(sortedAlbums);
    } catch (error) {
        console.error('Error calculating album popularity:', error);
        res.status(500).json({ message: 'Error calculating album popularity', error: error.message });
    }
});

//Get all surprise songs for home page
router.get('/surprise-songs', async (req, res) => {
    try {
      const users = await User.find({ 'erasTourSetList': { $exists: true, $ne: [] } });
      
      const surpriseSongs = users.map(user => {
        const surpriseSongEra = user.erasTourSetList.find(era => era.era === 'Surprise Songs');
        return {
          username: user.username,
          guitar: surpriseSongEra?.songs[0]?.title || 'Not set',
          piano: surpriseSongEra?.songs[1]?.title || 'Not set'
        };
      }).filter(song => song.guitar !== 'Not set' || song.piano !== 'Not set');
  
      res.json(surpriseSongs);
    } catch (error) {
      console.error('Error fetching surprise songs:', error);
      res.status(500).json({ message: 'Error fetching surprise songs', error: error.message });
    }
  });

module.exports = router;
