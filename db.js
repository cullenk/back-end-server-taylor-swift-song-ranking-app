const { MongoClient } = require('mongodb')

let dbConnection;
let uri = 'mongodb+srv://cullenkuch:thanKyouaIMee@taylorswiftcluster.72erlko.mongodb.net/?retryWrites=true&w=majority&appName=taylorSwiftCluster'

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
