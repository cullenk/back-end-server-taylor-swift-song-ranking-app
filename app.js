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

app.use(cors({
  origin: 'http://localhost:4200', // Replace with your Angular app's URL
  credentials: true
}));

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

//JWT Authentication middleware to populate req.user

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, "secret_string", (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header missing' });
  }
};

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

app.post('/login', async (req, res) => {
  try {
    const user = await UserModel.findOne({username: req.body.username});
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    const token = jwt.sign(
      {username: user.username, userId: user._id},
      "secret_string",
      {expiresIn: "1h"}
    );

    res.status(200).json({
      token: token,
      expiresIn: 3600
    });
  } catch (error) {
    res.status(500).json({ message: 'Error with authentication' });
  }
});

// Get user's top 13 list
app.get('/user/top-thirteen', authenticateJWT, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).populate('rankings.topThirteen.albumId');
    res.json(user.rankings.topThirteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update a song in the top 13 list
app.post('/user/top-thirteen', authenticateJWT, async (req, res) => {
  const { slot, albumId, songTitle } = req.body;

  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user.rankings) {
      user.rankings = { topThirteen: [] };
    }
    const song = user.rankings.topThirteen.find(item => item.slot === slot);

    if (song) {
      song.albumId = albumId;
      song.songTitle = songTitle;
    } else {
      user.rankings.topThirteen.push({ slot, albumId, songTitle });
    }

    await user.save();
    res.json(user.rankings.topThirteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove a song from the top 13 list
app.delete('/user/top-thirteen/:slot', authenticateJWT, async (req, res) => {
  const slot = parseInt(req.params.slot);

  try {
    const user = await UserModel.findById(req.user.userId);
    if (user.rankings && user.rankings.topThirteen) {
      user.rankings.topThirteen = user.rankings.topThirteen.filter(item => item.slot !== slot);
      await user.save();
    }
    res.json(user.rankings.topThirteen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user rankings
app.get('/rankings', authenticateJWT, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select('rankings');
    res.json(user.rankings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Update a specific ranking list
app.put('/rankings/:listName', authenticateJWT, async (req, res) => {
  const { listName } = req.params;
  const { rankings } = req.body;

  try {
    let user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.rankings) {
      user.rankings = {};
    }

    if (listName === 'topThirteen') {
      user.rankings.topThirteen = rankings;
    } else {
      if (!user.rankings.albumRankings) {
        user.rankings.albumRankings = {};
      }
      user.rankings.albumRankings[listName] = rankings;
    }

    await user.save();

    res.json(user.rankings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
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
    const songTitle = decodeURIComponent(req.query.songTitle);
    console.log('Searching for song:', songTitle); // Add this log

    // Find the album that contains the specified song, remove parenthesis or special characters
    console.log('Query:', {
      'songs.title': { $regex: new RegExp(songTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });
    const album = await Album.findOne({
      'songs.title': { $regex: new RegExp(songTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });
    console.log('Album found:', album);

    if (!album) {
      console.log('Album not found for song:', songTitle);
      return res.status(404).json({ 
        message: `Song "${songTitle}" not found in any Taylor Swift album!`,
        searchedTitle: songTitle,
        decodedTitle: decodeURIComponent(req.query.songTitle)
      });
    }

    res.json(album);
  } catch (err) {
    console.error('Error in /albumBySong:', err); // Add this log
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

