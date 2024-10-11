const mongoose = require('mongoose');
const User = require('./myModels/userModel');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

async function resetTrackRankings() {
  try {
    const result = await User.updateMany(
      { 'rankings.trackRankings': { $exists: true } },
      { $unset: { 'rankings.trackRankings': "" } }
    );

    console.log(`Track rankings reset for ${result.nModified} users.`);
  } catch (error) {
    console.error('Error resetting track rankings:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
resetTrackRankings();