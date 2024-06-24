const mongoose = require('mongoose')

const albumSchema = new mongoose.Schema({
    title: String,
    releaseYear: Number,
    songs: [{ title: String, duration: String, audioSource: String}],
    albumImage: String
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
