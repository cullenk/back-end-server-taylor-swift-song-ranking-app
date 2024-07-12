const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Album = require('./myModels/albumModel');
require('dotenv').config();

async function insertFreshData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const albumFiles = fs.readdirSync('./albums'); // Directory where JSON files are stored

    for (const file of albumFiles) {
      const albumData = JSON.parse(fs.readFileSync(path.join('./albums', file), 'utf8'));

      // Ensure each song has the album field
      albumData.songs = albumData.songs.map(song => ({
        ...song,
        album: albumData.title
      }));

      const album = new Album(albumData);
      await album.save();
    }

    console.log('Data insertion completed successfully');
  } catch (error) {
    console.error('Data insertion failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

insertFreshData();
