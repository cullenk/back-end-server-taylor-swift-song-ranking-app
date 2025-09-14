const mongoose = require('mongoose');
const fs = require('fs');
const Album = require('./myModels/albumModel');
require('dotenv').config();

async function updateSinglesAlbumToCloudFront() {
    let connection;
    
    try {
        // Connect to MongoDB
        connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        // Step 1: Create Backup of Singles album
        console.log('💾 Creating backup of Singles album...');
        const singlesAlbumBackup = await Album.findOne({ title: "Singles" }).lean();
        if (singlesAlbumBackup) {
            const backupData = {
                timestamp: new Date().toISOString(),
                album: singlesAlbumBackup
            };
            fs.writeFileSync('./backup-singles-s3-to-cloudfront.json', JSON.stringify(backupData, null, 2));
            console.log('✅ Backup saved to backup-singles-s3-to-cloudfront.json\n');
        }

        // Step 2: Convert S3 URLs to CloudFront URLs
        console.log('🔄 Converting Singles album images from S3 to CloudFront...');
        const singlesAlbum = await Album.findOne({ title: "Singles" });
        
        if (!singlesAlbum) {
            console.log('❌ Singles album not found in database');
            return;
        }

        let songsUpdated = 0;
        const updateLog = [];

        singlesAlbum.songs.forEach(song => {
            const currentUrl = song.albumImageSource;
            
            // Convert from S3 URL to CloudFront URL
            if (currentUrl.includes('all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/singles/')) {
                // Extract the filename from the S3 URL
                const filename = currentUrl.split('/singles/')[1];
                const cloudFrontUrl = `https://d3e29z0m37b0un.cloudfront.net/singles/${filename}`;
                
                updateLog.push({
                    song: song.title,
                    from: currentUrl,
                    to: cloudFrontUrl,
                    filename: filename
                });
                song.albumImageSource = cloudFrontUrl;
                songsUpdated++;
                console.log(`   ✓ ${song.title}: ${filename}`);
            } else if (currentUrl.includes('d3e29z0m37b0un.cloudfront.net')) {
                console.log(`   → Already CloudFront: ${song.title}`);
            } else {
                console.log(`   ⚠️  Unexpected URL format: ${song.title}`);
                console.log(`      URL: ${currentUrl}`);
            }
        });

        // Save the updated album
        if (songsUpdated > 0) {
            await singlesAlbum.save();
            console.log(`\n✅ Successfully converted ${songsUpdated} songs to CloudFront URLs`);
            
            // Show sample conversions
            console.log('\n📋 Sample Conversions:');
            updateLog.slice(0, 3).forEach((update, index) => {
                console.log(`${index + 1}. ${update.song}`);
                console.log(`   From: all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com/singles/${update.filename}`);
                console.log(`   To:   d3e29z0m37b0un.cloudfront.net/singles/${update.filename}\n`);
            });
        } else {
            console.log('\nℹ️  No songs needed updating');
        }

        // Step 3: Verification
        console.log('🔍 Verification - checking URL sources...');
        const verificationAlbum = await Album.findOne({ title: "Singles" });
        
        const urlStats = {
            cloudfront: 0,
            s3: 0,
            other: 0
        };

        const cloudFrontSongs = [];
        const s3Songs = [];
        const otherSongs = [];

        verificationAlbum.songs.forEach(song => {
            const url = song.albumImageSource;
            if (url.includes('d3e29z0m37b0un.cloudfront.net')) {
                urlStats.cloudfront++;
                cloudFrontSongs.push(song.title);
            } else if (url.includes('all-taylor-swift-album-covers.s3.us-east-2.amazonaws.com')) {
                urlStats.s3++;
                s3Songs.push(song.title);
            } else {
                urlStats.other++;
                otherSongs.push(song.title);
            }
        });

        console.log(`\n📊 URL Source Statistics:`);
        console.log(`   Total songs: ${verificationAlbum.songs.length}`);
        console.log(`   CloudFront: ${urlStats.cloudfront} ✅`);
        console.log(`   S3: ${urlStats.s3} ${urlStats.s3 > 0 ? '⚠️' : ''}`);
        console.log(`   Other: ${urlStats.other} ${urlStats.other > 0 ? '⚠️' : ''}`);

        const conversionComplete = urlStats.cloudfront === verificationAlbum.songs.length;
        console.log(`   Status: ${conversionComplete ? '✅ All using CloudFront' : '⚠️ Some still using S3/other'}`);

        // Show any remaining S3 URLs
        if (s3Songs.length > 0) {
            console.log(`\n📋 Songs still using S3 URLs:`);
            s3Songs.forEach(song => {
                console.log(`   - ${song}`);
            });
        }

        // Show any other URLs
        if (otherSongs.length > 0) {
            console.log(`\n📋 Songs with other URL formats:`);
            otherSongs.forEach(song => {
                console.log(`   - ${song}`);
            });
        }

        console.log('\n🎉 Singles S3 to CloudFront conversion completed!');
        console.log(`📦 Benefits: Faster global delivery via CloudFront CDN`);
        console.log(`💾 Backup available at: backup-singles-s3-to-cloudfront.json`);

    } catch (error) {
        console.error('❌ Conversion failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

// Helper function to rollback if needed
async function rollbackSinglesS3Conversion() {
    try {
        if (!fs.existsSync('./backup-singles-s3-to-cloudfront.json')) {
            console.log('❌ No backup file found');
            return;
        }

        const backupData = JSON.parse(fs.readFileSync('./backup-singles-s3-to-cloudfront.json', 'utf8'));
        
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        
        await Album.findOneAndReplace({ title: "Singles" }, backupData.album);
        console.log('✅ Singles album rolled back to S3 URLs successfully');
        console.log(`📅 Restored to backup from: ${backupData.timestamp}`);
        
        await connection.close();
    } catch (error) {
        console.error('❌ Rollback failed:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'rollback') {
        rollbackSinglesS3Conversion().catch(error => {
            console.error('💥 Rollback failed:', error);
            process.exit(1);
        });
    } else {
        updateSinglesAlbumToCloudFront().catch(error => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
    }
}

module.exports = { updateSinglesAlbumToCloudFront, rollbackSinglesS3Conversion };