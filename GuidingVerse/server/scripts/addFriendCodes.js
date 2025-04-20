import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js'; // Adjust path as needed
import User from '../src/models/User.js';   // Adjust path as needed
import { generateUniqueFriendCode } from '../src/utils/codeUtils.js'; // Adjust path as needed

// Load environment variables (specifically DB connection string)
dotenv.config({ path: '../.env' }); // Adjust path to find your .env file relative to the script location

async function migrateUsers() {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    let updatedCount = 0;
    let errorCount = 0;
    const batchSize = 100; // Process users in batches
    let processedCount = 0;

    try {
        console.log('Finding users without friend codes...');
        // Find users where friendCode does not exist or is null/empty
        const usersWithoutCodeCursor = User.find({ 
            $or: [
                { friendCode: { $exists: false } },
                { friendCode: null },
                { friendCode: '' }
            ]
         }).cursor();

        console.log('Starting migration...');

        for (let user = await usersWithoutCodeCursor.next(); user != null; user = await usersWithoutCodeCursor.next()) {
            processedCount++;
            console.log(`Processing user ${processedCount}: ${user.username} (${user._id})`);
            try {
                const uniqueCode = await generateUniqueFriendCode();
                console.log(` -> Generated code: ${uniqueCode}`);
                
                await User.updateOne({ _id: user._id }, { $set: { friendCode: uniqueCode } });
                
                console.log(` -> Successfully updated user ${user._id} with code ${uniqueCode}.`);
                updatedCount++;
            } catch (updateError) {
                console.error(` -> Error updating user ${user._id}:`, updateError.message);
                errorCount++;
                // Decide if you want to stop on error or continue
                // continue;
            }

             // Optional: Add a small delay to avoid overwhelming the DB/API if generating many codes
             // await new Promise(resolve => setTimeout(resolve, 50)); 
        }

        console.log('\nMigration Summary:');
        console.log(`- Total users processed: ${processedCount}`);
        console.log(`- Users successfully updated: ${updatedCount}`);
        console.log(`- Errors encountered: ${errorCount}`);

    } catch (err) {
        console.error('\nAn error occurred during the migration process:', err);
    } finally {
        console.log('\nDisconnecting from database...');
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
}

migrateUsers(); 