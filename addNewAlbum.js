const mongoose = require('mongoose');
const Album = require('./myModels/albumModel');
require('dotenv').config();

const newAlbum = {
    title: "The Life of a Showgirl",
    releaseYear: 2025, 
    albumCover: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg", // Update with actual cover URL
    songs: [
        {
            title: "The Fate of Ophelia",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Elizabeth Taylor",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Opalite",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Father Figure",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Eldest Daughter",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Ruin the Friendship",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Actually Romantic",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Wi$h Li$t",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Wood",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "CANCELLED!",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "Honey",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        },
          {
            title: "The Life of a Showgirl (feat. Sabrina Carpenter)",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/song-title.mp3",
            albumImageSource: "https://all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/the-life-of-a-showgirl/album-cover.jpg",
            albumName: "The Life of a Showgirl"
        }
    ]
};

async function addNewAlbum() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Check if album already exists
        const existingAlbum = await Album.findOne({ title: newAlbum.title });
        if (existingAlbum) {
            console.log(`Album "${newAlbum.title}" already exists. Updating with new songs...`);
            
            // Add new songs to existing album
            for (const newSong of newAlbum.songs) {
                if (!newSong.title || !newSong.audioSource || !newSong.albumImageSource) {
                    console.log(`Skipping invalid song: ${newSong.title}`);
                    continue;
                }

                // Check if song already exists in album
                const songExists = existingAlbum.songs.some(song => song.title === newSong.title);
                if (!songExists) {
                    console.log(`Adding song: ${newSong.title}`);
                    existingAlbum.songs.push(newSong);
                } else {
                    console.log(`Song "${newSong.title}" already exists in album`);
                }
            }

            await existingAlbum.save();
            console.log(`Album "${newAlbum.title}" updated successfully`);
        } else {
            // Create new album
            console.log(`Creating new album: ${newAlbum.title}`);
            const album = new Album(newAlbum);
            await album.save();
            console.log(`Album "${newAlbum.title}" created successfully with ${newAlbum.songs.length} songs`);
        }

    } catch (error) {
        console.error("Error adding album:", error);
    } finally {
        if (connection) await connection.close();
        console.log('MongoDB connection closed');
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    addNewAlbum();
}

module.exports = { addNewAlbum, newAlbum };