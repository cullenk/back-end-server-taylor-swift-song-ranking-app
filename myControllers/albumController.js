const express = require('express');
const router = express.Router();
const Album = require('../myModels/albumModel')
    
router.post('/add-album', async (req, res) => {
    try {
      // Check if req.body.songs exists and is an array
      if (!req.body.songs || !Array.isArray(req.body.songs)) {
        return res.status(400).json({ message: 'Invalid song data' });
      }
  
      const newAlbum = new Album({
        title: req.body.title,
        releaseYear: req.body.releaseYear,
        albumImage: req.body.albumImage,
        songs: req.body.songs.map(song => ({
          title: song.title,
          audioSource: song.audioSource
          // Add other song properties as needed
        }))
      });
  
      await newAlbum.save();
      res.status(201).json({ message: 'Album added successfully', album: newAlbum });
    } catch (error) {
      console.error('Error adding album:', error);
      res.status(500).json({ message: 'Error adding album', error: error.message });
    }
  });
  

module.exports = router;