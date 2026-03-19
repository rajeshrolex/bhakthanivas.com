const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    lodgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lodge',
        required: true
    },
    type: {
        type: String,
        enum: ['Non-AC', 'AC', 'Family', 'Dormitory'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    baseGuests: {
        type: Number,
        default: 2
    },
    extraGuestPrice: {
        type: Number,
        default: 0
    },
    maxOccupancy: {
        type: Number,
        default: 2
    },
    totalRooms: {
        type: Number,
        required: true,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    },
    amenities: {
        type: [String],
        default: []
    }
}, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

roomSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
