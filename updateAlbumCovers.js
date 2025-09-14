const mongoose = require('mongoose');
const fs = require('fs');
const Album = require('./myModels/albumModel');
require('dotenv').config();

// Mapping of album titles to new CloudFront WebP URLs
const albumCoverMapping = {
    "1989 (Taylor's Version)": "https://d3e29z0m37b0un.cloudfront.net/1989.webp",
    "evermore": "https://d3e29z0m37b0un.cloudfront.net/evermore.webp",
    "Fearless (Taylor's Version)": "https://d3e29z0m37b0un.cloudfront.net/fearless_taylors_version_album.webp",
    "folklore": "https://d3e29z0m37b0un.cloudfront.net/folklore.webp",
    "Lover": "https://d3e29z0m37b0un.cloudfront.net/lover.webp",
    "Midnights": "https://d3e29z0m37b0un.cloudfront.net/midnights.webp",
    "The Tortured Poets Department": "https://d3e29z0m37b0un.cloudfront.net/ttpd1.webp",
    "Red (Taylor's Version)": "https://d3e29z0m37b0un.cloudfront.net/red-tv.webp",
    "reputation": "https://d3e29z0m37b0un.cloudfront.net/reputation.webp",
    "Speak Now (Taylor's Version)": "https://d3e29z0m37b0un.cloudfront.net/speak-now-tv.webp",
    "Taylor Swift": "https://d3e29z0m37b0un.cloudfront.net/Taylor+Swift.webp"
};

async function updateAlbumCovers() {
    let connection;
    
    try {
        // Connect to MongoDB with timeout options
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        // Step 1: Create Backup
        console.log('💾 Creating backup of current album covers...');
        const albumsForBackup = await Album.find({}, 'title albumCover').lean();
        const backupData = {
            timestamp: new Date().toISOString(),
            totalAlbums: albumsForBackup.length,
            albums: albumsForBackup.reduce((acc, album) => {
                acc[album.title] = album.albumCover;
                return acc;
            }, {})
        };
        
        fs.writeFileSync('./backup-album-covers.json', JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to backup-album-covers.json (${albumsForBackup.length} albums)\n`);

        // Step 2: Update Albums Collection
        console.log('🔄 Updating Albums Collection...');
        const albums = await Album.find({});
        let albumsUpdated = 0;
        let songsUpdated = 0;

        for (const album of albums) {
            const newCoverUrl = albumCoverMapping[album.title];
            
            if (newCoverUrl) {
                let albumModified = false;
                
                // Update album cover if different
                if (album.albumCover !== newCoverUrl) {
                    album.albumCover = newCoverUrl;
                    albumModified = true;
                }

                // Update all song album image sources
                album.songs.forEach(song => {
                    if (song.albumImageSource !== newCoverUrl) {
                        song.albumImageSource = newCoverUrl;
                        albumModified = true;
                        songsUpdated++;
                    }
                });
                
                if (albumModified) {
                    await album.save();
                    albumsUpdated++;
                    console.log(`   ✓ Updated: ${album.title}`);
                } else {
                    console.log(`   → Already current: ${album.title}`);
                }
            } else {
                console.log(`   ⚠️  No mapping found for: ${album.title}`);
            }
        }

        // Step 3: Verification
        console.log('\n🔍 Verification...');
        const verificationResults = {};
        
        for (const [albumTitle, expectedUrl] of Object.entries(albumCoverMapping)) {
            const album = await Album.findOne({ title: albumTitle });
            if (album) {
                const allSongsMatch = album.songs.every(song => song.albumImageSource === expectedUrl);
                verificationResults[albumTitle] = {
                    albumCover: album.albumCover === expectedUrl ? '✅' : '❌',
                    allSongsMatch: allSongsMatch ? '✅' : '❌'
                };
            } else {
                verificationResults[albumTitle] = {
                    albumCover: '❌ Not Found',
                    allSongsMatch: '❌ Not Found'
                };
            }
        }

        console.log('\n📋 Verification Results:');
        console.table(verificationResults);

        console.log('\n🎉 Album cover update completed!');
        console.log(`📊 Albums updated: ${albumsUpdated}`);
        console.log(`🎵 Songs updated: ${songsUpdated}`);
        console.log(`📦 Now using WebP format via CloudFront CDN`);
        console.log(`💾 Backup saved for rollback if needed`);

    } catch (error) {
        console.error('❌ Update failed:', error);
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
    updateAlbumCovers().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { updateAlbumCovers, albumCoverMapping };