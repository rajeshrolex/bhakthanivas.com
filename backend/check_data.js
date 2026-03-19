const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { Room, Lodge } = require('./models');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const lodges = await Lodge.find().populate('rooms');
        console.log(`Total Lodges: ${lodges.length}`);
        for (const lodge of lodges) {
            console.log(`Lodge: "${lodge.name}" (${lodge.slug}) ID: ${lodge._id}`);
            if (lodge.rooms) {
                for (const room of lodge.rooms) {
                    console.log(`  Room: "${room.name}" | Type: ${room.type} | Total: ${room.totalRooms} | Available: ${room.available} | ID: ${room._id}`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
