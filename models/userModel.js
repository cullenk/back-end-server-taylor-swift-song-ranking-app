const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const rankingSchema = new mongoose.Schema({
  slot: Number,
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  songTitle: String,
  rank: Number
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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

module.exports = User
