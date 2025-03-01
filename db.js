const { MongoClient } = require('mongodb')
require('dotenv').config();
let dbConnection;
let uri = process.env.MONGODB_URI;

// Connect to the database and return the connection so the app.js file can access it

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(uri)
    .then((client) => {
      dbConnection = client.db()
      return cb()
    })
    .catch(err => {
      console.log(err)
      return cb(err)
    })
  },
  getDb: () => dbConnection
}
