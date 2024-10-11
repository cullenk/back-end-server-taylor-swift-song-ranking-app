const mongoose = require('mongoose');
const User = require('./myModels/userModel');
const Album = require('./myModels/albumModel');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

async function updateTrackRankingsWithAlbumCovers() {
  try {
    const users = await User.find({ 'rankings.trackRankings': { $exists: true } });
    const albums = await Album.find({});

    for (const user of users) {
      if (user.rankings && user.rankings.trackRankings) {
        user.rankings.trackRankings = await Promise.all(user.rankings.trackRankings.map(async trackList => 
          Promise.all(trackList.map(async track => {
            const album = albums.find(a => a.title === track.albumName);
            if (album) {
              const song = album.songs.find(s => s._id.toString() === track.songId);
              if (song) {
                return {
                  ...track,
                  albumImageSource: song.albumImageSource || album.albumCover || ''
                };
              }
            }
            return track; // If album or song not found, return the track unchanged
          }))
        ));
        await user.save();
      }
    }
    console.log('Track rankings updated with album covers');
  } catch (error) {
    console.error('Error updating track rankings:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
updateTrackRankingsWithAlbumCovers();