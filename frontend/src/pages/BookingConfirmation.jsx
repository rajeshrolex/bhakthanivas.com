import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    MapPin,
    Calendar,
    Users,
    Phone,
    MessageCircle,
    Share2,
    Home,
    Navigation,
    Clock,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useBooking } from '../context/BookingContext';
import { formatTo12Hour, calculateCheckOutTime } from '../utils/timeUtils';
import { getImageUrl, bookingAPI } from '../services/api';

const BookingConfirmation = () => {
    const { bookingId: urlBookingId } = useParams();
    const { bookingData, resetBooking, updateBookingData } = useBooking();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!urlBookingId) return;

            // If we already have this booking in context, don't fetch
            if (bookingData.bookingId === urlBookingId && bookingData.selectedLodge) {
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const data = await bookingAPI.getById(urlBookingId);
                if (data && data.bookingId) {
                    // Map backend data to context format
                    const mappedData = {
                        bookingId: data.bookingId,
                        selectedLodge: data.lodge || { 
                            _id: data.lodgeId, 
                            name: data.lodgeName,
                            address: 'Near Sri Raghavendra Swamy Mutt, Mantralayam',
                            images: [] 
                        },
                        selectedRoom: {
                            name: data.roomName,
                            type: data.roomType,
                            price: data.roomPrice
                        },
                        checkIn: data.checkIn,
                        checkOut: data.checkOut,
                        checkInTime: data.checkInTime,
                        guests: data.guests,
                        rooms: data.rooms,
                        customerDetails: {
                            name: data.customerName,
                            mobile: data.customerMobile,
                            email: data.customerEmail,
                            idType: data.idType,
                            idNumber: data.idNumber
                        },
                        paymentMethod: data.paymentMethod,
                        status: data.status,
                        amountPaid: data.amountPaid,
                        balanceAmount: data.balanceAmount,
                        totalAmount: data.totalAmount
                    };
                    updateBookingData(mappedData);
                } else {
                    setError('Booking not found');
                }
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Failed to load booking details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [urlBookingId, bookingData.bookingId, updateBookingData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Fetching your booking details...</p>
            </div>
        );
    }

    if (error || (!bookingData.bookingId && !urlBookingId) || (!bookingData.selectedLodge && !isLoading)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-soft">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {error || 'No Booking Found'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error ? 'We couldn\'t find a booking with that ID. Please check the URL or try again.' : 'Please make a booking first to see the confirmation page.'}
                    </p>
                    <Link to="/lodges" className="btn-primary inline-block">
                        Browse Lodges
                    </Link>
                </div>
            </div>
        );
    }

    const {
        selectedLodge,
        selectedRoom,
        checkIn,
        checkOut,
        checkInTime,
        checkOutTime,
        guests,
        customerDetails,
        paymentMethod,
        bookingId,
        amountPaid,
        balanceAmount
    } = bookingData;

    const totalNights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
        : 1;

    // Auto-calculate checkout time = check-in time + 23 hours per night
    const computedCheckOut = calculateCheckOutTime(checkIn || new Date().toISOString(), checkInTime || '12:00', checkOut || null);
    const displayCheckOutTime = checkOutTime || computedCheckOut.checkOutTime;
    const displayCheckOutDate = checkOut ? format(new Date(checkOut + 'T00:00:00'), 'dd MMM yyyy') : 'Tomorrow';


    const baseGuests = selectedRoom.baseGuests || selectedRoom.maxOccupancy || 1;
    const extraGuestPrice = selectedRoom.extraGuestPrice || 0;
    const extraGuests = Math.max(0, (guests || 1) - baseGuests);
    const perNightPrice = selectedRoom.price + extraGuests * extraGuestPrice;
    
    // Use the stored totalAmount if available, otherwise recalculate (with _stayTotal fallback)
    const totalPrice = bookingData.totalAmount || (
        selectedRoom._stayTotal != null 
            ? selectedRoom._stayTotal 
            : perNightPrice * totalNights
    );

    // Determine payment info
    const paidAmount = amountPaid ?? (paymentMethod !== 'payAtLodge' ? totalPrice : 0);
    const balanceDue = balanceAmount ?? (totalPrice - paidAmount);
    const isFullyPaid = paidAmount >= (totalPrice - 1); // Allow small rounding diffs
    const isPayAtLodge = paymentMethod === 'payAtLodge';

    const getWhatsAppShareUrl = () => {
        const message = `🙏 Booking Confirmed!\n\n` +
            `📋 Booking ID: ${bookingId}\n` +
            `🏨 ${selectedLodge.name}\n` +
            `🛏️ ${selectedRoom.name}\n` +
            `📅 ${checkIn ? format(new Date(checkIn), 'dd MMM yyyy') : 'Today'} - ${checkOut ? format(new Date(checkOut), 'dd MMM yyyy') : 'Tomorrow'}\n` +
            `💰 Total: ₹${totalPrice}` +
            (paidAmount > 0 && balanceDue > 0 ? ` (Paid: ₹${paidAmount}, Balance: ₹${balanceDue})` : '') +
            `\n\n📍 Location: Near Sri Raghavendra Swamy Mutt, Mantralayam`;

        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    };

    const getGoogleMapsUrl = () => {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLodge.address + ' Mantralayam')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-center mb-8"
                >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <CheckCircle size={40} className="text-white sm:hidden" />
                        <CheckCircle size={48} className="text-white hidden sm:block" />
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                    >
                        Booking Confirmed! 🎉
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600"
                    >
                        Your booking has been successfully confirmed
                    </motion.p>
                </motion.div>

                {/* Booking Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-3xl shadow-elevated overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm opacity-90">Booking ID</span>
                            <span className="font-mono font-bold text-sm sm:text-lg break-all">{bookingId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <img
                                src={getImageUrl(selectedLodge.images[0])}
                                alt="Lodge Photo"
                                className="w-16 h-16 rounded-xl object-cover"

                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                }}
                            />
                            <div>
                                <h2 className="font-bold text-lg sm:text-xl">{selectedLodge.name}</h2>
                                <p className="text-white/80">{selectedRoom.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Guest Info */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Guest Name</span>
                            <span className="font-medium text-gray-900">{customerDetails.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-600">Mobile</span>
                            <span className="font-medium text-gray-900">{customerDetails.mobile}</span>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <Calendar size={20} className="text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Check-in</p>
                                    <p className="font-medium text-gray-900">
                                        {checkIn ? format(new Date(checkIn), 'dd MMM yyyy') : 'Today'}
                                    </p>
                                    <p className="text-xs text-primary-600 flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatTo12Hour(checkInTime)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <Calendar size={20} className="text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Check-out</p>
                                    <p className="font-medium text-gray-900">
                                        {displayCheckOutDate}
                                    </p>

                                    {displayCheckOutTime && (
                                        <p className="text-xs text-primary-600 flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatTo12Hour(displayCheckOutTime)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Guests */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="flex items-center gap-2 text-gray-600">
                                <Users size={18} />
                                Guests
                            </span>
                            <span className="font-medium text-gray-900">{guests || 1} Guest(s)</span>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="py-3 border-b border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-medium text-gray-900">
                                    {isPayAtLodge ? 'Pay at Lodge' : 'UPI Payment'}
                                </span>
                            </div>

                            {paidAmount > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Paid Online</span>
                                    <span className="font-semibold text-green-600">₹{paidAmount} ✅</span>
                                </div>
                            )}

                            {balanceDue > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Balance Due at Lodge</span>
                                    <span className="font-semibold text-red-500">₹{balanceDue} 💰</span>
                                </div>
                            )}
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between py-4 bg-primary-50 rounded-xl px-4 -mx-2">
                            <span className="font-bold text-gray-900">Total Amount</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary-600">₹{totalPrice}</span>
                                {isFullyPaid && !isPayAtLodge && (
                                    <p className="text-xs text-green-600 font-medium">✅ Fully Paid</p>
                                )}
                                {balanceDue > 0 && (
                                    <p className="text-xs text-orange-600 font-medium">⏳ ₹{balanceDue} due at check-in</p>
                                )}
                            </div>
                        </div>

                        {/* Balance Warning */}
                        {balanceDue > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-sm text-amber-800 font-medium">
                                    💰 Please pay remaining <strong>₹{balanceDue}</strong> via Cash or UPI at the lodge during check-in.
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        <div className="pt-4">
                            <p className="flex items-start gap-2 text-gray-600 mb-3">
                                <MapPin size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
                                <span>{selectedLodge.address}</span>
                            </p>
                            <a
                                href={getGoogleMapsUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <Navigation size={18} />
                                Open in Google Maps
                            </a>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 sm:p-6 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <a
                                href={`tel:${selectedLodge.phone}`}
                                className="btn-call py-3 justify-center"
                            >
                                <Phone size={18} />
                                Call Lodge
                            </a>
                            <a
                                href={`https://wa.me/${selectedLodge.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi, my booking ID is ${bookingId}. I have booked ${selectedRoom.name}.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-whatsapp py-3 justify-center"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>
                        </div>

                        <a
                            href={getWhatsAppShareUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                        >
                            <Share2 size={18} />
                            Share Booking Details
                        </a>
                    </div>
                </motion.div>

                {/* Home Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8"
                >
                    <Link
                        to="/"
                        onClick={() => resetBooking()}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                        <Home size={20} />
                        Back to Home
                    </Link>
                </motion.div>

                {/* Important Notes */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
                >
                    <h3 className="font-bold text-yellow-800 mb-3">Important Information</h3>
                    <ul className="space-y-2 text-sm text-yellow-700">
                        <li>• Check-in time: <strong>{formatTo12Hour(checkInTime || '12:00')}</strong> | Check-out time: <strong>{formatTo12Hour(displayCheckOutTime)}</strong></li>
                        <li>• Stay duration: <strong>{totalNights} Night(s)</strong> (23-hour rule applies)</li>
                        <li>• Please carry a valid ID proof (Aadhar/Passport/DL)</li>
                        <li>• Contact the lodge if you're arriving late</li>
                        <li>• WhatsApp & SMS confirmation will be sent shortly</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default BookingConfirmation;
