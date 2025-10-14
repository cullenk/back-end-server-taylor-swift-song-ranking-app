const mongoose = require('mongoose');
const Album = require('./myModels/albumModel');
const User = require('./myModels/userModel');
require('dotenv').config();

const newAlbum = {
    title: "The Life of a Showgirl",
    releaseYear: 2025, 
    albumCover: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
    songs: [
        {
            title: "The Fate of Ophelia",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/The+Fate+of+Ophelia.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Elizabeth Taylor",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Elizabeth+Taylor.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Opalite",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Opalite.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Father Figure",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Father+Figure.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Eldest Daughter",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Eldest+Daughter.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Ruin The Friendship",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Ruin+The+Friendship.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Actually Romantic",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Actually+Romantic.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Wi$h Li$t",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Wi%24h+Li%24t.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Wood",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Wood.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "CANCELLED!",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/CANCELLED!.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "Honey",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/Honey.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        },
        {
            title: "The Life of a Showgirl (feat. Sabrina Carpenter)",
            audioSource: "https://all-taylor-swift-albums.s3.us-east-2.amazonaws.com/The+Life+of+a+Showgirl/The+Life+of+a+Showgirl.mp3",
            albumImageSource: "https://d3e29z0m37b0un.cloudfront.net/life-of-a-showgirl.webp",
            album: "The Life of a Showgirl"
        }
    ]
};

async function updateExistingAllSongsRankings(savedAlbum) {
    console.log('\n🔄 Updating existing user rankings with new songs...');
    
    try {
        // Find users who have existing all-songs rankings
        const users = await User.find({ 
            'rankings.allSongsRanking': { $exists: true, $ne: [] } 
        });

        console.log(`📊 Found ${users.length} users with existing all-songs rankings`);
        
        let usersUpdated = 0;
        let totalSongsAdded = 0;

        for (const user of users) {
            const existingRanking = user.rankings.allSongsRanking;
            const maxRank = Math.max(...existingRanking.map(song => song.rank), 0);
            
            let userSongsAdded = 0;
            let newRank = maxRank + 1;

            // Add new songs to the end of existing rankings
            for (const newSong of savedAlbum.songs) {
                const songExists = existingRanking.some(s => 
                    s.songId === newSong._id.toString() || s.songTitle === newSong.title
                );
                
                if (!songExists) {
                    existingRanking.push({
                        songId: newSong._id.toString(),
                        songTitle: newSong.title,
                        album: savedAlbum.title,
                        audioSource: newSong.audioSource,
                        rank: newRank++,
                        albumImageSource: newSong.albumImageSource || savedAlbum.albumCover
                    });
                    userSongsAdded++;
                    totalSongsAdded++;
                }
            }
            
            if (userSongsAdded > 0) {
                await user.save();
                usersUpdated++;
                console.log(`   ✓ Updated ${user.username}: +${userSongsAdded} songs`);
            } else {
                console.log(`   → ${user.username}: No new songs needed`);
            }
        }

        console.log(`\n📈 Migration Summary:`);
        console.log(`   Users updated: ${usersUpdated}`);
        console.log(`   Total songs added: ${totalSongsAdded}`);
        console.log(`   New songs added to bottom of existing rankings`);

    } catch (error) {
        console.error('❌ Error updating user rankings:', error);
        throw error;
    }
}

async function addNewAlbum() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Check if album already exists
        const existingAlbum = await Album.findOne({ title: newAlbum.title });
        let savedAlbum;

        if (existingAlbum) {
            console.log(`📀 Album "${newAlbum.title}" already exists. Updating with new songs...`);
            
            let songsAdded = 0;
            // Add new songs to existing album
            for (const newSong of newAlbum.songs) {
                if (!newSong.title || !newSong.audioSource || !newSong.albumImageSource) {
                    console.log(`⚠️  Skipping invalid song: ${newSong.title}`);
                    continue;
                }

                // Check if song already exists in album
                const songExists = existingAlbum.songs.some(song => song.title === newSong.title);
                if (!songExists) {
                    console.log(`   ➕ Adding song: ${newSong.title}`);
                    existingAlbum.songs.push(newSong);
                    songsAdded++;
                } else {
                    console.log(`   ↩️  Song "${newSong.title}" already exists in album`);
                }
            }

            savedAlbum = await existingAlbum.save();
            console.log(`✅ Album "${newAlbum.title}" updated successfully (+${songsAdded} songs)`);
        } else {
            // Create new album
            console.log(`🆕 Creating new album: ${newAlbum.title}`);
            const album = new Album(newAlbum);
            savedAlbum = await album.save();
            console.log(`✅ Album "${newAlbum.title}" created successfully with ${newAlbum.songs.length} songs`);
        }

        // Update existing user rankings with new songs
        await updateExistingAllSongsRankings(savedAlbum);

        console.log('\n🎉 Album addition and user ranking updates completed!');
        console.log(`📝 New songs have been added to the bottom of existing user rankings`);
        console.log(`🔄 Users can now reorder these songs in their all-songs rankings`);

    } catch (error) {
        console.error("❌ Error adding album:", error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    addNewAlbum().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { addNewAlbum, newAlbum, updateExistingAllSongsRankings };