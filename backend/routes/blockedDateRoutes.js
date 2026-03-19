const express = require('express');
const router = express.Router();
const BlockedDate = require('../models/BlockedDate');
const { authenticate, isAdmin } = require('../middleware/auth');

// @route   GET /api/blocked-dates/:lodgeId/month/:monthStr
// @desc    Get blocked dates for a lodge in a specific month
// @access  Public
router.get('/:lodgeId/month/:monthStr', async (req, res) => {
    try {
        const { lodgeId, monthStr } = req.params; // monthStr like 'YYYY-MM'

        // Find blocks matching the month prefix
        const blocks = await BlockedDate.find({
            lodgeId,
            date: { $regex: `^${monthStr}` }
        });

        res.json(blocks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/blocked-dates/:lodgeId
// @desc    Get all blocked dates for a lodge (optional)
// @access  Public
router.get('/:lodgeId', async (req, res) => {
    try {
        const blocks = await BlockedDate.find({ lodgeId: req.params.lodgeId });
        res.json(blocks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/blocked-dates
// @desc    Block a date for a lodge
// @access  Private/Admin
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
        const { lodgeId, date, reason } = req.body;

        let block = await BlockedDate.findOne({ lodgeId, date });

        if (block) {
            block.reason = reason || block.reason;
            await block.save();
        } else {
            block = await BlockedDate.create({
                lodgeId,
                date,
                reason
            });
        }
        res.status(201).json(block);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/blocked-dates/:id
// @desc    Unblock a date
// @access  Private/Admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const block = await BlockedDate.findById(req.params.id);

        if (!block) {
            return res.status(404).json({ message: 'Blocked date not found' });
        }

        await BlockedDate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Date unblocked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
