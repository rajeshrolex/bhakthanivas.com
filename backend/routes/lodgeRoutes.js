const express = require('express');
const router = express.Router();
const { Lodge, Room, Booking } = require('../models');
const BlockedDate = require('../models/BlockedDate');

// Get all lodges (with rooms)
router.get('/', async (req, res) => {
    try {
        const lodges = await Lodge.find().sort({ createdAt: -1 }).populate('rooms');

        // Fetch all blocked dates to attach to the lodges
        const allBlockedDates = await BlockedDate.find();

        const lodgesWithBlocks = lodges.map(lodge => {
            const lodgeBlockedDates = allBlockedDates
                .filter(b => b.lodgeId.toString() === lodge._id.toString())
                .map(b => b.date);

            const lodgeData = lodge.toJSON();
            lodgeData.blockedDates = lodgeBlockedDates;
            return lodgeData;
        });

        res.json(lodgesWithBlocks);
    } catch (err) {
        console.error('Error fetching lodges:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get single lodge by slug
// Accepts optional ?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD to compute date-aware availability
router.get('/:slug', async (req, res) => {
    try {
        const lodge = await Lodge.findOne({ slug: req.params.slug }).populate('rooms');

        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        const blockedDates = await BlockedDate.find({ lodgeId: lodge._id });
        const lodgeData = lodge.toJSON();
        lodgeData.blockedDates = blockedDates.map(b => b.date);

        // --- Dynamic availability based on date range ---
        const { checkIn, checkOut } = req.query;
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn + 'T00:00:00');
            const checkOutDate = new Date(checkOut + 'T00:00:00');

            if (checkInDate < checkOutDate) {
                // Find all active bookings for this lodge that overlap the requested dates.
                // An overlap occurs when: booking.checkIn < checkOutDate AND booking.checkOut > checkInDate
                const overlappingBookings = await Booking.find({
                    lodgeId: lodge._id,
                    status: { $nin: ['cancelled', 'checked-out'] },
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate }
                });

                // Build list of each night in the requested stay [checkIn, checkOut)
                const nights = [];
                let cur = new Date(checkInDate);
                while (cur < checkOutDate) {
                    nights.push(new Date(cur));
                    cur.setDate(cur.getDate() + 1);
                }

                // For each room name, find the PEAK occupancy across all nights.
                // A booking covers a night if: booking.checkIn <= night < booking.checkOut
                // We take the max so that e.g. 8 booked on night-1 + 8 booked on night-2
                // correctly shows 8 peak (not 16 summed).
                const peakOccupancyByName = {};
                for (const night of nights) {
                    const nightCountByName = {};
                    for (const booking of overlappingBookings) {
                        const bIn = new Date(booking.checkIn);
                        const bOut = new Date(booking.checkOut);
                        // booking covers this night if checkIn <= night < checkOut
                        if (bIn <= night && night < bOut && booking.roomName) {
                            const count = parseInt(booking.rooms) || 1;
                            nightCountByName[booking.roomName] = (nightCountByName[booking.roomName] || 0) + count;
                        }
                    }
                    // Update peak occupancy for each room name
                    for (const [name, count] of Object.entries(nightCountByName)) {
                        peakOccupancyByName[name] = Math.max(peakOccupancyByName[name] || 0, count);
                    }
                }

                // Overwrite the available field on each room with dynamic count
                // available = totalRooms - peakOccupancy (the worst/busiest night in the stay)
                lodgeData.rooms = lodgeData.rooms.map(room => {
                    const baseCapacity = room.available || 0;
                    const peakBooked = peakOccupancyByName[room.name] || 0;
                    const dynamicAvailable = Math.max(0, baseCapacity - peakBooked);
                    return { ...room, available: dynamicAvailable };
                });
            }

        }

        res.json(lodgeData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new lodge (admin)
router.post('/', async (req, res) => {
    try {
        const { rooms, ...lodgeData } = req.body;

        console.log('Creating lodge with data:', lodgeData);
        console.log('Rooms data:', rooms);

        const lodge = await Lodge.create(lodgeData);

        // Create rooms if provided
        if (rooms && rooms.length > 0) {
            const roomsWithLodgeId = rooms.map(room => ({
                ...room,
                lodgeId: lodge._id
            }));
            console.log('Creating rooms:', roomsWithLodgeId);
            await Room.insertMany(roomsWithLodgeId);
        }

        // Fetch the complete lodge with rooms
        const savedLodge = await Lodge.findById(lodge._id).populate('rooms');

        res.status(201).json(savedLodge);
    } catch (err) {
        console.error('Error creating lodge:', err);
        console.error('Error details:', err.message);
        res.status(400).json({ message: err.message, error: err.toString() });
    }
});

// Update lodge (admin)
router.put('/:id', async (req, res) => {
    try {
        const { rooms, ...lodgeData } = req.body;

        console.log('Updating lodge with data:', lodgeData);
        console.log('Rooms data:', rooms);

        const lodge = await Lodge.findByIdAndUpdate(req.params.id, lodgeData, { new: true });

        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        // Update rooms if provided
        if (rooms) {
            // Delete existing rooms and recreate
            await Room.deleteMany({ lodgeId: req.params.id });
            const roomsWithLodgeId = rooms.map(room => ({
                ...room,
                lodgeId: lodge._id
            }));
            console.log('Updating rooms:', roomsWithLodgeId);
            await Room.insertMany(roomsWithLodgeId);
        }

        const updatedLodge = await Lodge.findById(req.params.id).populate('rooms');
        res.json(updatedLodge);
    } catch (err) {
        console.error('Error updating lodge:', err);
        console.error('Error details:', err.message);
        res.status(400).json({ message: err.message, error: err.toString() });
    }
});

// Block / Unblock lodge (super_admin)
router.patch('/:id/block-toggle', async (req, res) => {
    try {
        const lodge = await Lodge.findById(req.params.id);
        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }
        lodge.isBlocked = !lodge.isBlocked;
        await lodge.save();
        res.json({ isBlocked: lodge.isBlocked, message: lodge.isBlocked ? 'Lodge blocked successfully' : 'Lodge unblocked successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete lodge (admin)
router.delete('/:id', async (req, res) => {
    try {
        const deletedLodge = await Lodge.findByIdAndDelete(req.params.id);

        if (!deletedLodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        // Also delete associated rooms
        await Room.deleteMany({ lodgeId: req.params.id });

        res.json({ message: 'Lodge deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
