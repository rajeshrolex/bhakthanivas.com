const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    lodgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lodge',
        required: true
    },
    lodgeName: String,
    // Flattened room info
    roomType: String,
    roomName: String,
    roomPrice: Number,

    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    checkInTime: {
        type: String,
        default: '12:00'
    },
    guests: {
        type: Number,
        default: 1
    },
    rooms: {
        type: Number,
        default: 1
    },
    // Customer details
    customerName: {
        type: String,
        required: true
    },
    customerMobile: {
        type: String,
        required: true
    },
    customerEmail: String,
    idType: String,
    idNumber: String,

    paymentMethod: {
        type: String,
        enum: ['payAtLodge', 'online'],
        default: 'payAtLodge'
    },
    paymentId: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

bookingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Virtual populate for lodge
bookingSchema.virtual('lodge', {
    ref: 'Lodge',
    localField: 'lodgeId',
    foreignField: '_id',
    justOne: true
});


// Maintain API compatibility for nested structures
// Notes: Mongoose toJSON transform can handle this, or we can just return flattened structure
// and let the frontend adapt, BUT the plan was to minimize frontend breakage.
// The SQL model had a custom toJSON. Let's replicate that logic in a transform.

bookingSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        // ret._id = ret._id; // Keep _id for frontend compatibility
        delete ret.__v;

        // Construct nested objects
        ret.room = {
            type: ret.roomType,
            name: ret.roomName,
            price: ret.roomPrice
        };

        ret.customerDetails = {
            name: ret.customerName,
            mobile: ret.customerMobile,
            email: ret.customerEmail,
            idType: ret.idType,
            idNumber: ret.idNumber
        };

        // Remove flat fields from output (optional, keeping them might be safer if used elsewhere)
        // keeping them as top level AND nested is fine, or deleting them. 
        // SQL model deleted them. Let's delete them to match exactly.
        delete ret.roomType;
        delete ret.roomName;
        delete ret.roomPrice;
        delete ret.customerName;
        delete ret.customerMobile;
        delete ret.customerEmail;
        delete ret.idType;
        delete ret.idNumber;

        return ret;
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
