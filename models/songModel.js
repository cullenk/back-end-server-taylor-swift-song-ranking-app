const mongoose = require('mongoose')

const songSchema = new mongoose.Schema({
    title: String,
    // duration: Number,
    audioSource: String
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
