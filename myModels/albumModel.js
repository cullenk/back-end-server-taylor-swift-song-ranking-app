const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: String,
    audioSource: String,
    albumCover: String,
    albumName: String 
});

const albumSchema = new mongoose.Schema({
    title: String,
    releaseYear: Number,
    albumCover: String,
    songs: [songSchema]
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
