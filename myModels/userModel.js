const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


const albumRankingSchema = new mongoose.Schema({
  rank: Number,
  albumName: String,
  albumCover: String
});

const rankingSchema = new mongoose.Schema({
  slot: Number,
  albumName: String,
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', default: null },
  songTitle: String,
  albumCover: String,
  rank: Number
});

const eraSetListSongSchema = new mongoose.Schema({
  title: String,
  audioSource: String,
  isMashup: { type: Boolean, default: false }
});

const eraSetListSchema = new mongoose.Schema({
  order: Number,
  era: String,
  songs: [eraSetListSongSchema]
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  theme: { type: String, default: 'default' },
  profileImage: { type: String, default: '' },
  loginCount: { type: Number, default: 0 },
  profileQuestions: [{
    question: String,
    answer: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  rankings: {
    topThirteen: [rankingSchema],
    albumRankings: {
      taylorSwift: [rankingSchema],
      fearless: [rankingSchema],
      speakNow: [rankingSchema],
      red: [rankingSchema],
      nineteenEightyNine: [rankingSchema],
      reputation: [rankingSchema],
      lover: [rankingSchema],
      folklore: [rankingSchema],
      evermore: [rankingSchema],
      midnights: [rankingSchema],
      theTorturedPoetsDepartment: [rankingSchema],
      standaloneSingles: [rankingSchema],
      allAlbums: [albumRankingSchema]
    },
    trackRankings: [[{
      songId: String,
      songTitle: String,
      albumName: String,
      audioSource: String,
      rank: Number,
      albumImageSource: String,
    }]],
    allSongsRanking: [{
      songId: String,
      songTitle: String,
      albumName: String,
      audioSource: String,
      rank: Number,
      albumImageSource: String,
    }],
  },
  erasTourSetList: [eraSetListSchema]
});

userSchema.plugin(uniqueValidator);

const User = mongoose.model('User', userSchema);

module.exports = User;
