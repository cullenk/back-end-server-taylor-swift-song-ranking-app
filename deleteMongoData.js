const mongoose = require('mongoose');
const Album = require('./myModels/albumModel');
require('dotenv').config();

async function clearAlbumsCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Album.deleteMany({});
    console.log('Albums collection cleared.');
  } catch (error) {
    console.error('Error clearing Albums collection:', error);
  } finally {
    mongoose.disconnect();
  }
}

clearAlbumsCollection();