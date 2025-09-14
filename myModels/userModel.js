const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const countries = require('../utils/countries');
 
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
  country: { 
    type: String, 
    default: null,
    enum: {
      values: [null, ...countries], // Allow null and valid countries
      message: 'Please select a valid country from the list'
    }
  },
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

// Existing indexes
userSchema.index({ 'rankings.albumRankings.allAlbums': 1 });
userSchema.index({ 'erasTourSetList': 1 });
userSchema.index({ 'rankings.topThirteen': 1 });
userSchema.index({ 'rankings.trackRankings': 1 });
userSchema.index({ 'rankings.allSongsRanking': 1 });
userSchema.index({ 'country': 1 });

// Ensure virtual fields are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.plugin(uniqueValidator);

const User = mongoose.model('User', userSchema);

module.exports = User;
