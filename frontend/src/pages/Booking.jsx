import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    User,
    Phone,
    Mail,
    CreditCard,
    Building2,
    ChevronLeft,
    Check,
    Shield,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useBooking } from '../context/BookingContext';
import { useRazorpay } from '../hooks/useRazorpay';
import { idTypes } from '../data/mockData';
import { formatTo12Hour, calculateCheckOutTime } from '../utils/timeUtils';
import { getImageUrl } from '../services/api';

const Booking = () => {
    const navigate = useNavigate();
    const {
        bookingData,
        setCustomerDetails,
        setPaymentMethod,
        setCheckInTime,
        submitBooking,
        isSubmitting,
        calculateTotalNights
    } = useBooking();

    const { initiatePayment, loading: paymentLoading } = useRazorpay();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        idType: 'aadhar',
        idNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [paymentOption, setPaymentOption] = useState('full'); // 'full', 'partial', 'lodge'
    const [agreedToTerms, setAgreedToTerms] = useState(false);


    // Redirect if no lodge/room selected or lodge is blocked
    if (!bookingData.selectedLodge || !bookingData.selectedRoom || bookingData.selectedLodge.isBlocked) {
        const isBlocked = bookingData.selectedLodge?.isBlocked;
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {isBlocked ? 'Booking Unavailable' : 'No Room Selected'}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {isBlocked
                            ? 'This lodge is currently not accepting new bookings. Please select another lodge.'
                            : 'Please select a room first to proceed with booking.'}
                    </p>
                    <button onClick={() => navigate('/lodges')} className="btn-primary">
                        Browse Lodges
                    </button>
                </div>
            </div>
        );
    }

    const { selectedLodge, selectedRoom, checkIn, checkOut, guests } = bookingData;
    const totalNights = calculateTotalNights() || 1;

    const rooms = bookingData.rooms || 1;
    const baseGuests = (selectedRoom.baseGuests || selectedRoom.maxOccupancy || 1) * rooms;
    const extraGuestPrice = selectedRoom.extraGuestPrice || 0;
    const extraGuests = Math.max(0, (guests || 1) - baseGuests);

    // Use pre-computed stay total from daily price calendar (if present), else fall back to standard
    const totalPrice = selectedRoom._stayTotal != null
        ? selectedRoom._stayTotal
        : (selectedRoom.price + extraGuests * extraGuestPrice) * totalNights;

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
        else if (!/^[6-9]\d{9}$/.test(formData.mobile)) newErrors.mobile = 'Enter valid 10-digit mobile';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Enter valid email';
        }
        if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = () => {
        if (validateForm()) {
            setCustomerDetails(formData);
            // Sync payment method with the default payment option ('full' -> 'upi')
            setPaymentMethod(paymentOption === 'lodge' ? 'payAtLodge' : 'upi');
            setStep(2);
        }
    };

    const handlePaymentSelect = (method) => {
        setPaymentMethod(method);
    };

    const handleConfirmBooking = async () => {
        // Determine amount to pay based on payment option
        let amountToPay = totalPrice;

        if (paymentOption === 'partial') {
            amountToPay = Math.ceil(totalPrice / 2);
        }

        if (bookingData.paymentMethod === 'upi') {
            // Initiate Razorpay Payment with partial or full amount
            await initiatePayment(
                {
                    totalAmount: amountToPay, // Use partial amount if selected
                    lodgeName: selectedLodge.name,
                    guestName: bookingData.customerDetails.name,
                    email: bookingData.customerDetails.email,
                    phone: bookingData.customerDetails.mobile,
                    checkIn: checkIn,
                    checkOut: checkOut
                },
                async (paymentSuccess) => {
                    console.log('Payment successful:', paymentSuccess);
                    try {
                        // On Payment Success, submit booking with payment details
                        const result = await submitBooking({
                            paymentId: paymentSuccess.paymentId,
                            orderId: paymentSuccess.orderId,
                            status: 'paid',
                            amountPaid: amountToPay,
                            balanceAmount: totalPrice - amountToPay
                        });
                        console.log('Booking result:', result);

                        // Navigate to confirmation page regardless
                        navigate(`/booking/confirmation/${result.bookingId}`);
                    } catch (error) {
                        console.error('Error submitting booking after payment:', error);
                        // Still navigate to confirmation - payment was successful
                        if (error?.bookingId) {
                            navigate(`/booking/confirmation/${error.bookingId}`);
                        } else {
                            navigate('/booking/confirmation');
                        }
                    }
                },
                (error) => {
                    console.error('Payment failed:', error);
                    alert('Payment failed. Please try again or select Pay at Lodge.');
                }
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-14 sm:top-16 md:top-20 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <button
                        onClick={() => step === 1 ? navigate(-1) : setStep(1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft size={20} />
                        <span>{step === 1 ? 'Back to Lodge' : 'Back to Details'}</span>
                    </button>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200'
                                }`}>
                                {step > 1 ? <Check size={16} /> : '1'}
                            </div>
                            <span className="hidden sm:inline font-medium">Details</span>
                        </div>
                        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200'
                                }`}>
                                2
                            </div>
                            <span className="hidden sm:inline font-medium">Payment</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-2xl p-6 shadow-soft"
                            >
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Guest Details
                                </h2>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter full name as per ID"
                                                className={`input-primary pl-10 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mobile Number *
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleInputChange}
                                                placeholder="10-digit mobile number"
                                                maxLength={10}
                                                className={`input-primary pl-10 ${errors.mobile ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                                    </div>

                                    {/* Check-in Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Check-in Time
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    value={(() => {
                                                        const t = bookingData.checkInTime || '12:00';
                                                        const h = parseInt(t.split(':')[0], 10);
                                                        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                        return String(h12);
                                                    })()}
                                                    onChange={(e) => {
                                                        const t = bookingData.checkInTime || '12:00';
                                                        const [, mins] = t.split(':');
                                                        const h = parseInt(t.split(':')[0], 10);
                                                        const isPM = h >= 12;
                                                        let newH = parseInt(e.target.value, 10);
                                                        if (isPM) {
                                                            newH = newH === 12 ? 12 : newH + 12;
                                                        } else {
                                                            newH = newH === 12 ? 0 : newH;
                                                        }
                                                        setCheckInTime(`${String(newH).padStart(2, '0')}:${mins}`);
                                                    }}
                                                    className="input-primary pl-12 appearance-none"
                                                >
                                                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <span className="text-gray-500 font-bold">:</span>
                                            <select
                                                value={(() => {
                                                    const t = bookingData.checkInTime || '12:00';
                                                    return t.split(':')[1];
                                                })()}
                                                onChange={(e) => {
                                                    const t = bookingData.checkInTime || '12:00';
                                                    const hrs = t.split(':')[0];
                                                    setCheckInTime(`${hrs}:${e.target.value}`);
                                                }}
                                                className="input-primary appearance-none flex-1"
                                            >
                                                {['00', '15', '30', '45'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={(() => {
                                                    const t = bookingData.checkInTime || '12:00';
                                                    const h = parseInt(t.split(':')[0], 10);
                                                    return h >= 12 ? 'PM' : 'AM';
                                                })()}
                                                onChange={(e) => {
                                                    const t = bookingData.checkInTime || '12:00';
                                                    const [hStr, mins] = t.split(':');
                                                    let h = parseInt(hStr, 10);
                                                    const wasPM = h >= 12;
                                                    const nowPM = e.target.value === 'PM';
                                                    if (wasPM && !nowPM) {
                                                        h = h === 12 ? 0 : h - 12;
                                                    } else if (!wasPM && nowPM) {
                                                        h = h === 0 ? 12 : h + 12;
                                                    }
                                                    setCheckInTime(`${String(h).padStart(2, '0')}:${mins}`);
                                                }}
                                                className="input-primary appearance-none flex-1"
                                            >
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                        {bookingData.checkInTime && checkIn && (
                                            <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                                                <Clock size={12} />
                                                Checkout: {formatTo12Hour(calculateCheckOutTime(checkIn, bookingData.checkInTime, checkOut).checkOutTime)} ({totalNights * 24 - 1} hrs stay)
                                            </p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email (Optional)
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="For booking confirmation"
                                                className={`input-primary pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    {/* ID Type & Number */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ID Type *
                                            </label>
                                            <select
                                                name="idType"
                                                value={formData.idType}
                                                onChange={handleInputChange}
                                                className="input-primary"
                                            >
                                                {idTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ID Number *
                                            </label>
                                            <input
                                                type="text"
                                                name="idNumber"
                                                value={formData.idNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter ID number"
                                                className={`input-primary ${errors.idNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                            />
                                            {errors.idNumber && <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions Agreement */}
                                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                                    <div className="text-xs text-gray-600 mb-4 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {selectedLodge?.terms || 'Standard terms and conditions apply to all bookings.'}
                                    </div>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center mt-1">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className={`text-sm select-none ${errors.terms ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                                            I have read and agree to the Terms & Conditions and Cancellation Policy
                                        </span>
                                    </label>
                                    {errors.terms && <p className="text-red-500 text-xs mt-1 ml-8">{errors.terms}</p>}
                                </div>

                                <button
                                    onClick={(e) => {
                                        if (!agreedToTerms) {
                                            setErrors(prev => ({ ...prev, terms: 'Please agree to the terms and conditions' }));
                                            return;
                                        }
                                        handleSubmit(e);
                                    }}
                                    className="w-full btn-primary mt-6 py-4 text-lg"
                                >
                                    Continue to Payment
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-2xl p-6 shadow-soft"
                            >
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Payment Options
                                </h2>

                                {/* Payment Options */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <button
                                        onClick={() => {
                                            setPaymentOption('full');
                                            handlePaymentSelect('upi');
                                        }}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${paymentOption === 'full' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-800">Full Payment</span>
                                            {paymentOption === 'full' && <Check className="w-5 h-5 text-primary-500" />}
                                        </div>
                                        <p className="text-2xl font-bold text-primary-600 mb-1">₹{totalPrice}</p>
                                        <p className="text-sm text-gray-500">Pay full amount now to confirm booking</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setPaymentOption('partial');
                                            handlePaymentSelect('upi');
                                        }}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${paymentOption === 'partial' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-800">Partial Payment</span>
                                            {paymentOption === 'partial' && <Check className="w-5 h-5 text-primary-500" />}
                                        </div>
                                        <p className="text-2xl font-bold text-primary-600 mb-1">₹{Math.ceil(totalPrice / 2)}</p>
                                        <p className="text-sm text-gray-500">Pay token amount, balance at lodge</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setPaymentOption('lodge');
                                            handlePaymentSelect('payAtLodge');
                                        }}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${paymentOption === 'lodge' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-800">Pay at Lodge</span>
                                            {paymentOption === 'lodge' && <Check className="w-5 h-5 text-primary-500" />}
                                        </div>
                                        <p className="text-2xl font-bold text-primary-600 mb-1">₹0</p>
                                        <p className="text-sm text-gray-500">Book now, pay full amount at check-in</p>
                                    </button>
                                </div>

                                {/* Security Note */}
                                <div className="flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-xl">
                                    <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">100% Secure Booking</p>
                                        <p className="text-sm text-gray-600">
                                            Your booking is confirmed instantly. Get WhatsApp & SMS confirmation.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting || paymentLoading}
                                    className={`w-full btn-primary mt-6 sm:mt-8 py-3 sm:py-4 text-base sm:text-lg ${isSubmitting || paymentLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting || paymentLoading ? 'Processing...' : `Confirm Booking • ₹${totalPrice}`}
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-soft sticky top-40">
                            <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>

                            {/* Lodge Info */}
                            <div className="flex gap-3 pb-4 mb-4 border-b border-gray-100">
                                <img
                                    src={getImageUrl(selectedLodge.images[0])}
                                    alt={selectedLodge.name}
                                    className="w-20 h-20 object-cover rounded-xl"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/400x300?text=No+Image';
                                    }}
                                />
                                <div>
                                    <h4 className="font-semibold text-gray-900 line-clamp-2">{selectedLodge.name}</h4>
                                    <p className="text-sm text-gray-600">{selectedRoom.name}</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-3 pb-4 mb-4 border-b border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Check-in
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {checkIn ? format(new Date(checkIn), 'dd MMM yyyy') : 'Today'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Check-out
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {checkOut ? format(new Date(checkOut), 'dd MMM yyyy') : 'Tomorrow'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 flex items-center gap-2">
                                        <Building2 size={16} />
                                        Rooms & Guests
                                    </span>
                                    <span className="font-medium text-gray-900">{rooms} {rooms === 1 ? 'Room' : 'Rooms'}, {guests || 1} {guests === 1 ? 'Guest' : 'Guests'}</span>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 pb-4 mb-4 border-b border-gray-100">
                                {selectedRoom._stayTotal != null ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Daily rates × {totalNights} nights
                                        </span>
                                        <span className="text-gray-900 font-medium">₹{totalPrice}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                Room base ({baseGuests > 1 ? `${baseGuests} guests` : `${baseGuests} guest`} across {rooms} {rooms === 1 ? 'room' : 'rooms'})
                                            </span>
                                            <span className="text-gray-900">₹{selectedRoom.price * rooms}</span>
                                        </div>
                                        {extraGuests > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Extra guests ({extraGuests} × ₹{extraGuestPrice})
                                                </span>
                                                <span className="text-gray-900">₹{extraGuests * extraGuestPrice}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                            <span className="text-gray-600">Per night × {totalNights}</span>
                                            <span className="text-gray-900 font-medium">₹{totalPrice}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Taxes & Fees</span>
                                    <span className="text-green-600">Included</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-primary-600">₹{totalPrice}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;
