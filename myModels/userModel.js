const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const rankingSchema = new mongoose.Schema({
  slot: Number,
  albumName: String,
  songId: { type: mongoose.Schema.Types.ObjectId },
  songTitle: String,
  albumCover: String,
  rank: Number
});

const eraSetListSongSchema = new mongoose.Schema({
  title: String,
  audioSource: String
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
  theme: String,
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
      standaloneSingles: [rankingSchema]
    }
  },
  erasTourSetList: [eraSetListSchema]
});

userSchema.plugin(uniqueValidator);

const User = mongoose.model('User', userSchema);

module.exports = User;