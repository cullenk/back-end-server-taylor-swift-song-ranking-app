const mongoose = require('mongoose');
const User = require('./myModels/userModel'); // Adjust the path as needed
require('dotenv').config(); // If you're using dotenv for environment variables

async function clearAllSongsRanking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear allSongsRanking for a specific user (by username or email)
    // const user = await User.findOne({ username: 'specificUsername' });
    // if (user) {
    //   user.rankings.allSongsRanking = [];
    //   await user.save();
    //   console.log(`Cleared allSongsRanking for user: ${user.username}`);
    // } else {
    //   console.log('User not found');
    // }

    // Clear allSongsRanking for all users
    const result = await User.updateMany(
      { 'rankings.allSongsRanking': { $exists: true } },
      { $unset: { 'rankings.allSongsRanking': "" } }
    );

    console.log(`Cleared allSongsRanking for ${result.nModified} users`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

clearAllSongsRanking();