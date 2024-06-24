const UserModel = require('./models/userModel')
const Album = require('./models/albumModel')

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dbUrl = "mongodb+srv://cullenkuch:thanKyouaIMee@taylorswiftcluster.72erlko.mongodb.net/taylorSwift?retryWrites=true&w=majority"
const jwt = require('jsonwebtoken')
const app = express();

// Parse incoming request bodies in a middleware before your handlers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// User sign-up endpoint and behavior

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document in MongoDB
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User login if account already created

app.post('/login', (req, res) => {
  let userFound;
  UserModel.findOne({username: req.body.username})
    .then(user => {
      if (!user) {
        // Throw an error instead of sending a response
        throw new Error('User not found');
      }
      userFound = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (!result) {
        // Throw an error instead of sending a response
        throw new Error('Password is incorrect');
      }
      const token = jwt.sign(
        {username: userFound.username, userId: userFound._id},
        "secret_string",
        {expiresIn: "1h"}
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600
      });
    })
    .catch(err => {
      // Handle all errors here
      if (err.message === 'User not found' || err.message === 'Password is incorrect') {
        res.status(401).json({
          message: err.message
        });
      } else {
        res.status(500).json({
          message: 'Error with authentication'
        });
      }
    });
});

// Get user's top 13 list
app.get('/user/top-thirteen', async (req, res) => {
  const user = await User.findById(req.user.id).populate('topThirteen.albumId');
  res.json(user.topThirteen);
});

// Add or update a song in the top 13 list
app.post('/user/top-thirteen', async (req, res) => {
  const { slot, albumId, songTitle } = req.body;
  const user = await User.findById(req.user.id);
  const song = user.topThirteen.find(item => item.slot === slot);

  if (song) {
    song.albumId = albumId;
    song.songTitle = songTitle;
  } else {
    user.topThirteen.push({ slot, albumId, songTitle });
  }

  await user.save();
  res.json(user.topThirteen);
});

// Remove a song from the top 13 list
app.delete('/user/top-thirteen/:slot', async (req, res) => {
  const slot = parseInt(req.params.slot);
  const user = await User.findById(req.user.id);
  user.topThirteen = user.topThirteen.filter(item => item.slot !== slot);
  await user.save();
  res.json(user.topThirteen);
});

// Return all albums

app.get('/allAlbums', async (req, res) => {
    try {
      const albums = await Album.find();
      res.json(albums);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

 //Return an album by searching for a song that it contains
 app.get('/albumBySong', async (req, res) => {
  try {
    const songTitle = req.query.songTitle;

    // Find the album that contains the specified song
    const album = await Album.findOne({
      'songs.title': { $regex: new RegExp(songTitle, 'i') }
    });

    if (!album) {
      return res.status(404).json({ message: 'This song is not found in any Taylor Swift album!' });
    }

    res.json(album);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Return a song from any album by search
app.get('/songSearch', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const albums = await Album.find({
      'songs.title': { $regex: new RegExp(searchQuery, 'i') }
    });

    const matchingSongs = albums.flatMap((album) =>
      album.songs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    res.json(matchingSongs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

