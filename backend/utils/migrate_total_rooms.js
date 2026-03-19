const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one directory up (backend root)
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Room } = require('../models');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Finding rooms with totalRooms: 0 or undefined...');
        const roomsToUpdate = await Room.find({
            $or: [
                { totalRooms: 0 },
                { totalRooms: { $exists: false } }
            ]
        });

        console.log(`Found ${roomsToUpdate.length} rooms to update.`);

        let updatedCount = 0;
        for (const room of roomsToUpdate) {
            room.totalRooms = room.available || 0;
            await room.save();
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} rooms.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
