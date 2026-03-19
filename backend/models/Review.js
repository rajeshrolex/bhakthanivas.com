const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        lodge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lodge',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;


