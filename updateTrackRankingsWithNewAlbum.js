const mongoose = require('mongoose');
const User = require('./myModels/userModel');
const Album = require('./myModels/albumModel');
require('dotenv').config();

// Track positions for "The Life of a Showgirl" songs
const newAlbumTrackMappings = {
    1: ["The Fate of Ophelia"],
    2: ["Elizabeth Taylor"], 
    3: ["Opalite"],
    4: ["Father Figure"],
    5: ["Eldest Daughter"],
    6: ["Ruin The Friendship"],
    7: ["Actually Romantic"],
    8: ["Wi$h Li$t"],
    9: ["Wood"],
    10: ["CANCELLED!"],
    11: ["Honey"],
    12: ["The Life of a Showgirl (feat. Sabrina Carpenter)"]
};

async function updateTrackRankingsWithNewAlbum() {
    let connection;
    
    try {
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        // Get the new album data
        const newAlbum = await Album.findOne({ title: "The Life of a Showgirl" });
        if (!newAlbum) {
            console.log('❌ "The Life of a Showgirl" album not found in database');
            return;
        }

        console.log(`📀 Found album: ${newAlbum.title} with ${newAlbum.songs.length} songs`);

        // Find users who have existing track rankings
        const users = await User.find({ 
            'rankings.trackRankings': { $exists: true, $ne: [] } 
        });

        console.log(`👥 Found ${users.length} users with existing track rankings`);

        let usersUpdated = 0;
        let totalSongsAdded = 0;

        for (const user of users) {
            let userModified = false;
            let userSongsAdded = 0;

            // Ensure trackRankings array has enough positions (extend to at least 12 tracks)
            while (user.rankings.trackRankings.length < 12) {
                user.rankings.trackRankings.push([]);
            }

            // Process each track position
            for (const [trackPosition, songTitles] of Object.entries(newAlbumTrackMappings)) {
                const trackIndex = parseInt(trackPosition) - 1; // Convert to 0-based index
                
                // Get current track ranking for this position
                const currentTrackList = user.rankings.trackRankings[trackIndex] || [];
                
                // Find the highest rank in current track list
                const maxRank = currentTrackList.length > 0 
                    ? Math.max(...currentTrackList.map(song => song.rank || 0))
                    : 0;

                // Add each new song for this track position
                for (const songTitle of songTitles) {
                    // Find the song in the album
                    const albumSong = newAlbum.songs.find(song => song.title === songTitle);
                    
                    if (!albumSong) {
                        console.log(`⚠️  Song "${songTitle}" not found in album`);
                        continue;
                    }

                    // Check if song already exists in this track position
                    const songExists = currentTrackList.some(song => 
                        song.songId === albumSong._id.toString() || 
                        song.songTitle === songTitle
                    );

                    if (!songExists) {
                        // Add song to the end of this track's ranking
                        const newRank = maxRank + currentTrackList.filter(s => !s.rank || s.rank <= maxRank).length + 1;
                        
                        const newTrackEntry = {
                            songId: albumSong._id.toString(),
                            songTitle: albumSong.title,
                            albumName: newAlbum.title,
                            audioSource: albumSong.audioSource,
                            rank: newRank,
                            albumImageSource: albumSong.albumImageSource || newAlbum.albumCover
                        };

                        user.rankings.trackRankings[trackIndex].push(newTrackEntry);
                        userModified = true;
                        userSongsAdded++;
                        totalSongsAdded++;

                        console.log(`   ➕ Added "${songTitle}" to track ${trackPosition} for ${user.username} (rank ${newRank})`);
                    }
                }
            }

            // Save user if modified
            if (userModified) {
                await user.save();
                usersUpdated++;
                console.log(`✅ Updated ${user.username}: +${userSongsAdded} songs across tracks`);
            } else {
                console.log(`→ ${user.username}: No new songs needed`);
            }

            // Progress indicator for large datasets
            if (usersUpdated % 25 === 0 && usersUpdated > 0) {
                console.log(`📊 Progress: ${usersUpdated}/${users.length} users updated...`);
            }
        }

        console.log('\n🎉 Track rankings migration completed!');
        console.log(`📈 Migration Summary:`);
        console.log(`   Users updated: ${usersUpdated}`);
        console.log(`   Total songs added: ${totalSongsAdded}`);
        console.log(`   New songs added to bottom of existing track rankings`);
        console.log(`   Users can now reorder these songs within each track position`);

        // Verification step
        console.log('\n🔍 Verification: Checking a sample user...');
        const sampleUser = await User.findOne({ 
            'rankings.trackRankings': { $exists: true, $ne: [] } 
        });
        
        if (sampleUser) {
            console.log(`📋 Sample user: ${sampleUser.username}`);
            console.log(`   Track rankings length: ${sampleUser.rankings.trackRankings.length}`);
            for (let i = 0; i < Math.min(5, sampleUser.rankings.trackRankings.length); i++) {
                const trackList = sampleUser.rankings.trackRankings[i];
                console.log(`   Track ${i + 1}: ${trackList.length} songs`);
                
                // Check if any new album songs are present
                const newAlbumSongs = trackList.filter(song => song.albumName === "The Life of a Showgirl");
                if (newAlbumSongs.length > 0) {
                    console.log(`     └─ New album songs: ${newAlbumSongs.map(s => s.songTitle).join(', ')}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

// Run if executed directly
if (require.main === module) {
    updateTrackRankingsWithNewAlbum().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { updateTrackRankingsWithNewAlbum, newAlbumTrackMappings };