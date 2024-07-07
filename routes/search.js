const express = require('express');
const router = express.Router();
const Album = require('../myModels/albumModel');
const { Song } = require('../myModels/songModel')


// Return all albums

router.get('/allAlbums', async (req, res) => {
    try {
      const albums = await Album.find();
      res.json(albums);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

 //Return an album by searching for a song that it contains
router.get('/albumBySong', async (req, res) => {
  try {
    const songTitle = decodeURIComponent(req.query.songTitle);
    console.log('Searching for song:', songTitle); // Add this log

    // Find the album that contains the specified song, remove parenthesis or special characters
    console.log('Query:', {
      'songs.title': { $regex: new RegExp(songTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });
    const album = await Album.findOne({
      'songs.title': { $regex: new RegExp(songTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });
    console.log('Album found:', album);

    if (!album) {
      console.log('Album not found for song:', songTitle);
      return res.status(404).json({ 
        message: `Song "${songTitle}" not found in any Taylor Swift album!`,
        searchedTitle: songTitle,
        decodedTitle: decodeURIComponent(req.query.songTitle)
      });
    }

    res.json(album);
  } catch (err) {
    console.error('Error in /albumBySong:', err); // Add this log
    res.status(500).json({ message: err.message });
  }
});

//Return a song from any album by search
router.get('/songSearch', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const albums = await Album.find({
      'songs.title': { $regex: new RegExp(searchQuery, 'i') }
    });

    const matchingSongs = albums.flatMap((album) =>
      album.songs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    res.json(matchingSongs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:albumName', async (req, res) => {
    try {
      const { albumName } = req.params;
      console.log('Searching for songs in album:', albumName);
      const album = await Album.findOne({ title: albumName });
      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }
      console.log('Found songs:', album.songs);
      res.json(album.songs);
    } catch (error) {
      console.error('Error fetching songs by album:', error);
      res.status(500).json({ message: 'Error fetching songs', error: error.message });
    }
  });
  
  

module.exports = router;