const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const rankingSchema = new mongoose.Schema({
  slot: Number,
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
  songTitle: String,
  rank: Number
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
  }
});

userSchema.plugin(uniqueValidator);

const User = mongoose.model('User', userSchema);

module.exports = User;

