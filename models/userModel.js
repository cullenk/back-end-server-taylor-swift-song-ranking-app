const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    topThirteen: [
        {
            slot: Number,
            albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
            songTitle: String
          }
          ]
});

userSchema.plugin(uniqueValidator);

const User = mongoose.model('User', userSchema);

module.exports = User;