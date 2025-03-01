/*This migration script is likely transforming your data model from having embedded song 
documents within albums to a structure where songs are separate documents referenced by albums. 
This change can provide more flexibility in querying and updating song data 
independently of albums. I think I did this when I needed to separate album covers 
for TTPD vs Anthology, so songs look to their own album cover photo not the parent album*/

const mongoose = require('mongoose');
const Album = require('./myModels/albumModel');
const { Song } = require('./myModels/songModel');
require('dotenv').config();

async function migrateData() {
  try {
    const albums = await Album.find();

    for (const album of albums) {
      if (!Array.isArray(album.songs)) {
        console.error(`Album ${album.title} does not have a songs array`);
        continue;
      }

      const updatedSongs = [];
      for (const song of album.songs) {
        // Create a new Song document
        const newSong = new Song({
          title: song.title,
          audioSource: song.audioSource,
          albumImageSource: song.albumImageSource,
          album: album._id
        });
        const savedSong = await newSong.save();
        updatedSongs.push(savedSong._id);
      }

      // Update the album with the updated song references
      await Album.findByIdAndUpdate(album._id, { songs: updatedSongs });
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => migrateData())
  .then(() => console.info("Data Migrated Successfully"))
  .catch((e) => console.error("DB Connection Error:", e));
