const mongoose = require('mongoose');
const { songSchema } = require('./songModel');

const albumSchema = new mongoose.Schema({
    title: String,
    releaseYear: Number,
    albumImage: String,
    songs: [songSchema]
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;

