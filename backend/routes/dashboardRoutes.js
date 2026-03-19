const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Booking, Lodge, Room } = require('../models');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const { lodgeId } = req.query;

        // Build filter for bookings
        let bookingQuery = {};
        let lodgeQuery = {};
        let roomQuery = {};

        if (lodgeId && lodgeId !== 'null' && lodgeId !== 'undefined') {
            // Convert string to ObjectId if valid
            const objectId = mongoose.Types.ObjectId.isValid(lodgeId)
                ? new mongoose.Types.ObjectId(lodgeId)
                : lodgeId;
            bookingQuery.lodgeId = objectId;
            lodgeQuery._id = objectId;
            roomQuery.lodgeId = objectId;
        }

        // Get counts
        const totalLodges = await Lodge.countDocuments(lodgeQuery);
        const totalBookings = await Booking.countDocuments(bookingQuery);

        // Get revenue - only from confirmed/completed bookings
        let aggregateMatch = { ...bookingQuery };
        // Only count revenue from confirmed, checked-in, or checked-out bookings
        aggregateMatch.status = { $in: ['confirmed', 'checked-in', 'checked-out'] };

        const revenueResult = await Booking.aggregate([
            { $match: aggregateMatch },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ["$totalAmount", 0] } }
                }
            }
        ]);
        const totalRevenue = revenueResult.length > 0 ? (revenueResult[0].total || 0) : 0;

        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRevenue = await Booking.aggregate([
            {
                $match: {
                    ...bookingQuery,
                    createdAt: { $gte: today },
                    status: { $in: ['confirmed', 'checked-in', 'checked-out'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ["$totalAmount", 0] } }
                }
            }
        ]);

        // Get total rooms
        const rooms = await Room.find(roomQuery);
        const totalRooms = rooms.reduce((acc, room) => acc + (room.available || 0), 0);

        // Calculate occupancy rate (simplified)
        const confirmedBookings = await Booking.countDocuments({
            ...bookingQuery,
            status: { $in: ['confirmed', 'checked-in'] }
        });

        const occupancyRate = totalRooms > 0
            ? Math.round((confirmedBookings / totalRooms) * 100)
            : 0;

        // Get recent bookings
        const recentBookings = await Booking.find(bookingQuery)
            .populate('lodge', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get pending bookings count
        const pendingBookings = await Booking.countDocuments({
            ...bookingQuery,
            status: 'pending'
        });

        // Get today's check-ins
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayCheckIns = await Booking.countDocuments({
            ...bookingQuery,
            checkIn: { $gte: today, $lte: todayEnd },
            status: { $in: ['confirmed', 'checked-in'] }
        });

        res.json({
            totalLodges,
            totalRooms,
            totalBookings,
            totalRevenue,
            todayRevenue: todayRevenue.length > 0 ? (todayRevenue[0].total || 0) : 0,
            pendingBookings,
            todayCheckIns,
            occupancyRate: Math.min(occupancyRate, 100),
            recentBookings
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
