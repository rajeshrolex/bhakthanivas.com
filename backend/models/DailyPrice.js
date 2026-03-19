const mongoose = require('mongoose');

const dailyPriceSchema = new mongoose.Schema({
    lodgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lodge',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    roomType: {
        type: String,
        enum: ['Non-AC', 'AC', 'Family', 'Dormitory'],
        required: true
    },
    price: {
        type: Number,
        required: false,
        min: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Each lodge+date+roomType combination must be unique
dailyPriceSchema.index({ lodgeId: 1, date: 1, roomType: 1 }, { unique: true });

const DailyPrice = mongoose.model('DailyPrice', dailyPriceSchema);

module.exports = DailyPrice;
