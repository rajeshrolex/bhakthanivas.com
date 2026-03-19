const express = require('express');
const router = express.Router();
const { Temple } = require('../models');

// Get all temples
router.get('/', async (req, res) => {
    try {
        const temples = await Temple.find().sort({ createdAt: -1 });
        res.json(temples);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single temple
router.get('/:id', async (req, res) => {
    try {
        const temple = await Temple.findById(req.params.id);
        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }
        res.json(temple);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create temple (super_admin only)
router.post('/', async (req, res) => {
    try {
        const temple = await Temple.create(req.body);
        res.status(201).json(temple);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update temple
router.put('/:id', async (req, res) => {
    try {
        const temple = await Temple.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }
        res.json(temple);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete temple
router.delete('/:id', async (req, res) => {
    try {
        const temple = await Temple.findByIdAndDelete(req.params.id);
        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }
        res.json({ message: 'Temple deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
