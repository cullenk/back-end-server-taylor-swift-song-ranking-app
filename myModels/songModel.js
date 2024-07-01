const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: String,
    audioSource: String
});

const Song = mongoose.model('Song', songSchema);

module.exports = { Song, songSchema };

