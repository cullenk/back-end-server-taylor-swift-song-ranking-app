const mongoose = require('mongoose');
const AlbumModelForNewSongs = require('./myModels/albumModelForNewSongs');
require('dotenv').config();

const newSongs = [
    {
        "title": "Gasoline (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Gasoline+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/gasoline.jpeg",
        "album": "HAIM - Women in Music Pt.III"
    },
    {
        "title": "Renegade (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Renegade+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/renegade.png",
        "album": "Big Red Machine - How Long Do You Think It's Gonna Last?"
    },
    {
        "title": "Babe (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Babe+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/Babe.jpeg",
        "album": "Sugarland - Single"
    },
    {
        "title": "Half Of My Heart (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Half+Of+My+Heart+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/half_of_my_heart.png",
        "album": "John Mayer - Battle Studies"
    },
    {
        "title": "Birch (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Birch+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/birch.jpg",
        "album": "Big Red Machine - How Long Do You Think It's Gonna Last?"
    },
    {
        "title": "The Joker And The Queen (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/The+Joker+And+The+Queen+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/joker_and_the_queen.jpg",
        "album": "Ed Sheeran - ="
    },
    {
        "title": "Lover (feat. Shawn Mendes)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Lover+(feat.+Shawn+Mendes).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/lover_remix.jpg",
        "album": "Taylor Swift - Remix"
    },
    {
        "title": "Both of Us (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Both+of+Us+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/Both_of_us.jpeg",
        "album": "B.o.B - Strange Clouds"
    },
    {
        "title": "Two Is Better Than One (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Two+Is+Better+Than+One+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/Two_Is_Better_than_One.png",
        "album": "Boys Like Girls - Love Drunk"
    },
    {
        "title": "The Alcott (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/The+Alcott+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/the_alcott.jpeg",
        "album": "The National - First Two Pages of Frankenstein"
    },
    {
        "title": "Us (feat. Taylor Swift)",
        "audioSource": "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/Singles/Us+(feat.+Taylor+Swift).mp3",
        "albumImageSource": "https://d3e29z0m37b0un.cloudfront.net/singles/us.jpeg",
        "album": "Gracie Abrams - The Secret Of Us"
    }
];

async function addNewSongs() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        const singlesAlbum = await AlbumModelForNewSongs.findOne({ title: "Singles" });
        if (!singlesAlbum) {
            console.log("Singles album not found. Creating new album.");
            singlesAlbum = new AlbumModelForNewSongs({
                title: "Singles",
                releaseYear: 2006,
                albumCover: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/singles/Singles.svg",
                songs: []
            });
        }

        // Remove all existing songs
        singlesAlbum.songs = [];

        // Add all songs
        for (const newSong of newSongs) {
            if (!newSong.title || !newSong.audioSource || !newSong.albumImageSource || !newSong.album) {
                console.log(`Skipping invalid song: ${newSong.title}`);
                continue;
            }

            console.log(`Adding song: ${newSong.title}`);
            singlesAlbum.songs.push(newSong);
        }

        await singlesAlbum.save();
        console.log("All songs added successfully");

    } catch (error) {
        console.error("Error adding songs:", error);
    } finally {
        if (connection) await connection.close();
        console.log('MongoDB connection closed');
    }
}

addNewSongs();