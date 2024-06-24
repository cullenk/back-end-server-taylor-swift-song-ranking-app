const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dbUrl = "mongodb+srv://cullenkuch:thanKyouaIMee@taylorswiftcluster.72erlko.mongodb.net/taylorSwift?retryWrites=true&w=majority"
const app = express();

app.use(cors())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


const http = require('http').Server(app)


const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

mongoose.connect(dbUrl, connectionParams)
.then(() => {
    console.info("Connected to the DB")
})
.catch((e) => {
    console.log("Error: ", e)
})

const Album = require('./models/albumModel')

// Route to retrieve all albums
app.get('/albums', async (req, res) => {
    try {
      const albums = await Album.find();
      res.json(albums);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

//Route to look up a song in the albums
app.get('/album', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const albums = await Album.find(
      { $text: { $search: searchQuery } },
      { 'songs.$': 1 }
    );

    const matchingSongs = albums.flatMap((album) => album.songs.filter((song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    res.json(matchingSongs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
});

