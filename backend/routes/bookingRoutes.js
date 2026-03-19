const express = require('express');
const router = express.Router();
const { Booking, Lodge, User, Room, DailyPrice } = require('../models');
const { sendBookingEmails } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/invoiceService');
const { sendBookingNotification } = require('../utils/whatsappService');
const { calculateCheckOutTime, formatTo12Hour } = require('../utils/timeUtils');

// Generate unique booking ID
const generateBookingId = () => {
    return 'MLY' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
};

// Format date for email
const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Get all bookings (with optional lodge filter for admins)
router.get('/', async (req, res) => {
    try {
        const { lodgeId, status } = req.query;
        let query = {};

        // Mongoose query building
        // Mongoose query building
        if (lodgeId && lodgeId !== 'undefined' && lodgeId !== 'null') {
            // Handle case where lodgeId might be passed as "null" string or actual id
            query.lodgeId = lodgeId;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('lodge', 'name slug')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single booking
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.id })
            .populate('lodge', 'name address phone whatsapp terms');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Download invoice PDF
router.get('/:id/invoice', async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.id })
            .populate('lodge', 'name address phone whatsapp');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const bookingDetails = {
            bookingId: booking.bookingId,
            bookingDate: formatDate(booking.createdAt),
            lodgeName: booking.lodgeName,
            roomName: booking.roomName,
            roomType: booking.roomType,
            guestName: booking.customerName,
            email: booking.customerEmail,
            phone: booking.customerMobile,
            checkIn: formatDate(booking.checkIn),
            checkOut: formatDate(booking.checkOut),
            checkInTime: formatTo12Hour(booking.checkInTime || '12:00'),
            checkOutTime: calculateCheckOutTime(booking.checkIn, booking.checkInTime, booking.checkOut).checkOutTime12,
            guests: booking.guests,
            amount: booking.totalAmount,
            amountPaid: booking.amountPaid,
            balanceAmount: booking.balanceAmount,
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentStatus,
            paymentId: booking.paymentId,
            terms: booking.lodge?.terms
        };

        const pdfBuffer = await generateInvoicePDF(bookingDetails);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Invoice-${booking.bookingId}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (err) {
        console.error('Invoice generation error:', err);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
});

// Create new booking
router.post('/', async (req, res) => {
    try {
        const bookingId = generateBookingId();

        // Get lodge details
        const lodge = await Lodge.findById(req.body.lodgeId);
        if (!lodge) {
            return res.status(404).json({ message: 'Lodge not found' });
        }

        // Get lodge admin email if exists
        let lodgeAdminEmail = null;
        const lodgeAdmin = await User.findOne({ lodgeId: req.body.lodgeId, role: 'admin' });
        if (lodgeAdmin) {
            lodgeAdminEmail = lodgeAdmin.email;
        }

        // Normalize payment method: 'upi' → 'online', keep 'payAtLodge' as is
        let paymentMethod = req.body.paymentMethod;
        if (paymentMethod === 'upi') {
            paymentMethod = 'online';
        }

        // Determine payment status based on payment method and details
        let paymentStatus = 'pending'; // Default

        // If online payment with successful payment details, mark as paid
        if (paymentMethod === 'online' && req.body.paymentDetails?.status === 'paid') {
            paymentStatus = 'paid';
        }
        // If pay at lodge, always pending
        else if (paymentMethod === 'payAtLodge') {
            paymentStatus = 'pending';
        }
        // Otherwise use provided status or default to pending
        else {
            paymentStatus = req.body.paymentStatus || req.body.paymentDetails?.status || 'pending';
        }

        console.log('Creating booking - Original method:', req.body.paymentMethod, '→ Normalized:', paymentMethod, 'Status:', paymentStatus);

        // Validate room availability before booking
        const roomsToBook = parseInt(req.body.rooms) || 1;
        if (req.body.room?.name) {
            const roomAvailability = await Room.findOne({
                lodgeId: req.body.lodgeId,
                name: req.body.room.name
            });

            if (!roomAvailability) {
                return res.status(404).json({ message: 'Room type not found' });
            }

            if (roomAvailability.available < roomsToBook) {
                return res.status(400).json({
                    message: `Only ${roomAvailability.available} room(s) available. You requested ${roomsToBook}.`,
                    available: roomAvailability.available
                });
            }

            // Check if this specific room type is blocked on any date during the stay
            if (req.body.checkIn && req.body.checkOut && req.body.room?.type) {
                const checkInDate = new Date(req.body.checkIn);
                const checkOutDate = new Date(req.body.checkOut);
                
                // Collect dates to check
                const datesToCheck = [];
                let cur = new Date(checkInDate);
                while (cur < checkOutDate) {
                    const y = cur.getFullYear();
                    const m = String(cur.getMonth() + 1).padStart(2, '0');
                    const d = String(cur.getDate()).padStart(2, '0');
                    datesToCheck.push(`${y}-${m}-${d}`);
                    cur.setDate(cur.getDate() + 1);
                }

                if (datesToCheck.length > 0) {
                    const blockedPrices = await DailyPrice.find({
                        lodgeId: req.body.lodgeId,
                        roomType: req.body.room.type,
                        date: { $in: datesToCheck },
                        isBlocked: true
                    });

                    if (blockedPrices && blockedPrices.length > 0) {
                        return res.status(400).json({
                            message: `The selected room type (${req.body.room.type}) is unavailable on one or more of your selected dates.`
                        });
                    }
                }
            }

            console.log(`Room availability check passed: ${roomAvailability.available} available, booking ${roomsToBook}`);
        }

        // Calculate amountPaid and balanceAmount
        const totalAmount = req.body.totalAmount;
        let amountPaid = 0;
        let balanceAmount = totalAmount;

        // If client provides explicit amountPaid/balanceAmount (partial payment), use those
        if (req.body.amountPaid !== undefined && req.body.amountPaid !== null) {
            amountPaid = Number(req.body.amountPaid);
            balanceAmount = Number(req.body.balanceAmount) || (totalAmount - amountPaid);
        } else if (paymentStatus === 'paid') {
            // Full payment (no explicit amounts provided)
            amountPaid = totalAmount;
            balanceAmount = 0;
        } else if (paymentMethod === 'payAtLodge') {
            // If pay at lodge, nothing paid yet, full balance due
            amountPaid = 0;
            balanceAmount = totalAmount;
        }

        console.log('Payment calculation:', { totalAmount, amountPaid, balanceAmount });

        const booking = await Booking.create({
            bookingId,
            lodgeId: req.body.lodgeId,
            lodgeName: lodge.name,
            roomType: req.body.room?.type,
            roomName: req.body.room?.name,
            roomPrice: req.body.room?.price,
            checkIn: req.body.checkIn,
            checkOut: req.body.checkOut,
            checkInTime: req.body.checkInTime || '12:00',
            guests: req.body.guests,
            rooms: req.body.rooms,
            customerName: req.body.customerDetails?.name,
            customerMobile: req.body.customerDetails?.mobile,
            customerEmail: req.body.customerDetails?.email,
            idType: req.body.customerDetails?.idType,
            idNumber: req.body.customerDetails?.idNumber,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount,
            amountPaid: amountPaid,
            balanceAmount: balanceAmount,
            paymentId: req.body.paymentDetails?.paymentId || null,
            paymentStatus: paymentStatus,
            status: 'confirmed'
        });

        // Room availability update removed as it's now handled dynamically in lodgeRoutes.js
        if (req.body.room?.name) {
            console.log(`Dynamic availability will account for this booking: ${req.body.room.name}`);
        } else {
            console.log('Missing room name in booking request');
        }

        // Send email notifications (async, don't wait)
        if (req.body.customerDetails?.email) {
            const protocol = req.protocol;
            const host = req.get('host');
            const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

            sendBookingEmails({
                bookingId,
                lodgeName: lodge.name,
                roomName: req.body.room?.name || 'Room',
                guestName: req.body.customerDetails?.name,
                email: req.body.customerDetails?.email,
                phone: req.body.customerDetails?.mobile,
                checkIn: formatDate(req.body.checkIn),
                checkOut: formatDate(req.body.checkOut),
                checkInTime: req.body.checkInTime || '12:00',
                checkOutTime: calculateCheckOutTime(req.body.checkIn, req.body.checkInTime, req.body.checkOut).checkOutTime12,
                guests: req.body.guests || 1,
                amount: totalAmount,
                amountPaid: amountPaid,
                balanceAmount: balanceAmount,
                paymentId: req.body.paymentDetails?.paymentId,
                paymentMethod: paymentMethod, // Use normalized payment method
                paymentStatus: paymentStatus, // Use determined payment status
                lodgeAdminEmail,
                lodgePhone: lodge.phone || '',
                lodgeWhatsapp: lodge.whatsapp || lodge.phone || '',
                terms: lodge.terms || '',
                baseUrl: baseUrl
            }).then(result => {
                console.log('Email notifications sent:', result);
            }).catch(err => {
                console.error('Failed to send email notifications:', err);
            });
        }

        // Send WhatsApp notification (async)
        sendBookingNotification({
            bookingId,
            lodgeName: lodge.name,
            guestName: req.body.customerDetails?.name,
            phone: req.body.customerDetails?.mobile,
            amountPaid: amountPaid,
            balanceAmount: balanceAmount
        }).then(sent => {
            console.log('WhatsApp notification status:', sent ? 'Processed' : 'Failed');
        }).catch(err => {
            console.error('WhatsApp notification error:', err);
        });

        res.status(201).json({ ...booking.toObject(), bookingId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update booking status
router.put('/:id', async (req, res) => {
    try {
        let booking;
        const id = req.params.id;
        const newStatus = req.body.status;

        // First, find the booking to get room details for availability update
        let existingBooking = await Booking.findOne({ bookingId: id });
        if (!existingBooking && id.match(/^[0-9a-fA-F]{24}$/)) {
            existingBooking = await Booking.findById(id);
        }

        // Update the booking status
        booking = await Booking.findOneAndUpdate(
            { bookingId: id },
            { status: newStatus },
            { new: true }
        );

        // If not found, and id looks like an ObjectId, try by _id
        if (!booking && id.match(/^[0-9a-fA-F]{24}$/)) {
            booking = await Booking.findByIdAndUpdate(
                id,
                { status: newStatus },
                { new: true }
            );
        }

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Room availability restoration removed as it's now handled dynamically in lodgeRoutes.js
        if (wasActive && isNowInactive && existingBooking) {
            console.log(`Booking ${newStatus}: dynamic availability will reflect this change for ${existingBooking.roomName}`);
        }

        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update payment status (mark as paid/received cash)
router.put('/:id/payment', async (req, res) => {
    try {
        const id = req.params.id;
        const { paymentStatus, paymentMethod, paymentId } = req.body;

        let updateData = { paymentStatus };

        // If marking as paid and no payment ID, generate one for cash
        if (paymentStatus === 'paid' && !paymentId) {
            updateData.paymentId = 'CASH_' + Date.now();
        } else if (paymentId) {
            updateData.paymentId = paymentId;
        }

        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }

        let booking;

        // Try to find by bookingId first
        booking = await Booking.findOneAndUpdate(
            { bookingId: id },
            updateData,
            { new: true }
        );

        // If not found, try by _id
        if (!booking && id.match(/^[0-9a-fA-F]{24}$/)) {
            booking = await Booking.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );
        }

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        console.log('Payment status updated:', booking.bookingId, paymentStatus);
        res.json(booking);
    } catch (err) {
        console.error('Error updating payment status:', err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
