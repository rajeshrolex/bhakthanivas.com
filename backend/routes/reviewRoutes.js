const express = require('express');
const router = express.Router();
const { Lodge, Review } = require('../models');

// Get reviews for a lodge by slug
router.get('/:slug', async (req, res) => {
    try {
        const lodge = await Lodge.findOne({ slug: req.params.slug });
        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        const reviews = await Review.find({ lodge: lodge._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
});

// Create a new review for a lodge by slug
router.post('/:slug', async (req, res) => {
    try {
        const { name, rating, comment } = req.body;

        if (!name || !rating || !comment) {
            return res.status(400).json({ message: 'Name, rating and comment are required' });
        }

        const lodge = await Lodge.findOne({ slug: req.params.slug });
        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        const review = await Review.create({
            lodge: lodge._id,
            name,
            rating,
            comment
        });

        // Recalculate lodge rating and reviewCount from all reviews
        const stats = await Review.aggregate([
            { $match: { lodge: lodge._id } },
            {
                $group: {
                    _id: '$lodge',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            lodge.rating = Number(stats[0].avgRating.toFixed(1));
            lodge.reviewCount = stats[0].count;
            await lodge.save();
        }

        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Failed to create review' });
    }
});

module.exports = router;


