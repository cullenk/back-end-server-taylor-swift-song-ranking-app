const express = require('express');
const router = express.Router();
const Album = require('../myModels/albumModel');


// Get all songs from all albums
router.get('/allSongs', async (req, res) => {
  try {
    const albums = await Album.find({});
    const allSongs = albums.flatMap(album => album.songs.map(song => ({
      ...song,
      albumName: album.title,
      albumCover: album.albumCover
    })));
    res.json(allSongs);
  } catch (error) {
    console.error('Error fetching all songs:', error);
    res.status(500).json({ message: 'Error fetching all songs', error: error.message });
  }
});

// Get album by title
router.get('/album/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    console.log('Searching for album with title:', title);
    const album = await Album.findOne({ title });
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    console.error('Error fetching album by title:', error);
    res.status(500).json({ message: 'Error fetching album by title', error: error.message });
  }
});

// Get songs by album title
router.get('/album/:title/songs', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    console.log('Searching for songs in album:', title);
    const album = await Album.findOne({ title });
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.json(album.songs);
  } catch (error) {
    console.error('Error fetching songs by album:', error);
    res.status(500).json({ message: 'Error fetching songs by album', error: error.message });
  }
});

// Search for a song by ID within the nested songs array of the albums
router.get('/songs/:songId', async (req, res) => {
    try {
        const { songId } = req.params;
        const albums = await Album.find({ 'songs._id': songId }, { 'songs.$': 1 });
        if (albums.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }
        const song = albums[0].songs[0];
        res.json(song);
    } catch (error) {
        console.error('Error fetching song by ID:', error);
        res.status(500).json({ message: 'Error fetching song by ID', error: error.message });
    }
});

// Get all albums
router.get('/allAlbums', async (req, res) => {
  try {
    const albums = await Album.find({});
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ message: 'Error fetching albums', error: error.message });
  }
});


router.get('/albumBySong', async (req, res) => {
    try {
      const songTitle = decodeURIComponent(req.query.songTitle);
      console.log('Searching for song:', songTitle);
  
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
      console.error('Error in /albumBySong:', err);
      res.status(500).json({ message: err.message });
    }
  });
  
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
  

module.exports = router;