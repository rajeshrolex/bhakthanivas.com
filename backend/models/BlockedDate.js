const mongoose = require('mongoose');

const blockedDateSchema = new mongoose.Schema({
    lodgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lodge',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    reason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// A lodge can only be blocked once per date
blockedDateSchema.index({ lodgeId: 1, date: 1 }, { unique: true });

const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);

module.exports = BlockedDate;
