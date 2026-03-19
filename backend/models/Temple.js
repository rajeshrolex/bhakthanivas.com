const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    googleMapsLink: {
        type: String,
        default: ''
    },
    distance: {
        type: String,
        default: ''
    },
    darshanTimings: {
        type: String,
        default: ''
    },
    specialDarshanTimings: {
        type: String,
        default: ''
    },
    nearbyRailwayStationTitle: {
        type: String,
        default: 'Nearby Railway Station'
    },
    nearbyRailwayStation: {
        type: String,
        default: ''
    },
    busTimingsTitle: {
        type: String,
        default: 'Bus Timings'
    },
    busTimings: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    additionalInfo: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

templeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Temple = mongoose.model('Temple', templeSchema);

module.exports = Temple;
