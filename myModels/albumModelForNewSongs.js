const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: String,
    audioSource: String,
    albumImageSource: String,
    album: String 
});

const albumSchema = new mongoose.Schema({
    title: String,
    releaseYear: Number,
    albumCover: String,
    songs: [songSchema]
});

const AlbumModelForNewSongs = mongoose.model('AlbumModelForNewSongs', albumSchema);

module.exports = AlbumModelForNewSongs;
