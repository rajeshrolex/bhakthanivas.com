const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Room } = require('../models');

async function testCapacity() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find a room to test
        const room = await Room.findOne();
        if (!room) {
            console.log('No rooms found to test.');
            process.exit(1);
        }

        console.log(`Testing with room: ${room.name}, Current Available: ${room.available}, Total: ${room.totalRooms}`);

        const roomsToRestore = 5; // A large number to test the cap

        const updateResult = await Room.findOneAndUpdate(
            { _id: room._id },
            [
                {
                    $set: {
                        available: {
                            $min: [
                                { $add: ["$available", roomsToRestore] },
                                { $ifNull: ["$totalRooms", "$available"] }
                            ]
                        }
                    }
                }
            ],
            { new: true }
        );

        console.log(`After "restoring" ${roomsToRestore} rooms:`);
        console.log(`New Available: ${updateResult.available} (Should be <= ${updateResult.totalRooms})`);

        if (updateResult.available <= updateResult.totalRooms) {
            console.log('✅ Capacity enforcement works!');
        } else {
            console.log('❌ Capacity enforcement FAILED!');
        }

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testCapacity();
