import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MapPin,
    Phone,
    MessageCircle,
    Star,
    ChevronLeft,
    Share2,
    Heart,
    Navigation,
    Clock,
    Users,
    Loader2,
    Calendar,
    Building2,
    ShieldAlert
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import PhotoGallery from '../components/lodge/PhotoGallery';
import RoomCard from '../components/lodge/RoomCard';
import { AmenityList } from '../components/lodge/AmenityBadge';
import ReviewsSection from '../components/lodge/ReviewsSection';
import { lodgeAPI, dailyPriceAPI } from '../services/api';
import { useBooking } from '../context/BookingContext';

const LodgeDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { selectLodge, selectRoom, setDates, setGuests, setRooms, bookingData } = useBooking();

    const [lodge, setLodge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);

    // Date picker state
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const [checkIn, setCheckIn] = useState(bookingData.checkIn ? format(new Date(bookingData.checkIn), 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'));
    const [checkOut, setCheckOut] = useState(bookingData.checkOut ? format(new Date(bookingData.checkOut), 'yyyy-MM-dd') : format(tomorrow, 'yyyy-MM-dd'));
    const [guests, setGuestsValue] = useState(bookingData.guests || 1);
    const [rooms, setRoomsValue] = useState(bookingData.rooms || 1);

    // Daily price overrides: { 'YYYY-MM-DD': { 'Non-AC': price, 'AC': price, ... } }
    const [dailyPriceMap, setDailyPriceMap] = useState({});

    // Fetch lodge from API
    useEffect(() => {
        const fetchLodge = async () => {
            try {
                setLoading(true);
                const data = await lodgeAPI.getBySlug(slug, checkIn, checkOut);
                setLodge(data);
                selectLodge(data);
            } catch (error) {
                console.error('Error fetching lodge:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLodge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    // Check availability for selected date range
    const checkAvailability = async () => {
        if (!lodge) return;
        try {
            setAvailabilityLoading(true);
            setSelectedRoom(null);
            const data = await lodgeAPI.getBySlug(slug, checkIn, checkOut);
            setLodge(data);
        } catch (error) {
            console.error('Error checking availability:', error);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    // Fetch daily price overrides for every night in the stay (handles cross-month stays)
    useEffect(() => {
        if (!lodge) return;

        // Helper: format a Date as local YYYY-MM-DD (avoids UTC offset bugs in IST etc.)
        const toLocalDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        // Collect all unique YYYY-MM months in the stay
        const months = new Set();
        const start = new Date(checkIn + 'T00:00:00');
        const end = new Date(checkOut + 'T00:00:00');
        let cur = new Date(start);
        while (cur < end) {
            months.add(toLocalDate(cur).slice(0, 7)); // local YYYY-MM
            cur.setDate(cur.getDate() + 1);
        }

        Promise.all([...months].map(m => dailyPriceAPI.getByMonth(lodge._id, m)))
            .then(results => {
                const map = {};
                results.flat().forEach(item => {
                    const date = item.date.substring(0, 10);
                    if (!map[date]) map[date] = {};
                    // Store full object {price, isBlocked} so isRoomTypeBlocked can read isBlocked
                    map[date][item.roomType] = { price: item.price, isBlocked: !!item.isBlocked };
                });
                setDailyPriceMap(map);
            })
            .catch(() => setDailyPriceMap({}));
    }, [lodge?._id, checkIn, checkOut]);

    // Keep the context's selectedRoom in sync with latest dates/rooms/guests/prices
    useEffect(() => {
        if (selectedRoom) {
            selectRoom({
                ...selectedRoom,
                _stayTotal: computeStayTotal(selectedRoom)
            });
        }
    }, [checkIn, checkOut, dailyPriceMap, rooms, guests]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading lodge details...</p>
                </div>
            </div>
        );
    }

    if (!lodge || lodge.isBlocked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {!lodge ? 'Lodge Not Found' : 'Lodge Temporarily Unavailable'}
                    </h1>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {!lodge
                            ? "The lodge you're looking for doesn't exist or has been removed."
                            : "This lodge is currently not accepting new bookings through our platform. Please check other available lodges."}
                    </p>
                    <Link to="/lodges" className="btn-primary">
                        Browse Other Lodges
                    </Link>
                </div>
            </div>
        );
    }


    // Effective price for a room on a specific date (default: check-in date for display)
    const getEffectivePrice = (room, date = checkIn) => {
        // dailyPriceMap[date][type] is now {price, isBlocked}
        const entry = dailyPriceMap[date]?.[room?.type];
        const override = entry !== undefined ? entry.price : undefined;
        return override != null ? override : (room?.price || 0);
    };

    // Helper to check if any selected date is blocked
    const isDateRangeBlocked = () => {
        if (!lodge || !lodge.blockedDates || lodge.blockedDates.length === 0) return false;

        const start = new Date(checkIn + 'T00:00:00');
        const end = new Date(checkOut + 'T00:00:00');

        // Check every date from checkIn (inclusive) to checkOut (exclusive)
        let cur = new Date(start);
        while (cur < end) {
            const dateStr = format(cur, 'yyyy-MM-dd');
            if (lodge.blockedDates.includes(dateStr)) return true;
            cur.setDate(cur.getDate() + 1);
        }
        return false;
    };

    const hasBlockedDates = isDateRangeBlocked();

    // Helper to check if a single room type is blocked on any date in the range
    const isRoomTypeBlocked = (room) => {
        if (!room) return false;
        const start = new Date(checkIn + 'T00:00:00');
        const end = new Date(checkOut + 'T00:00:00');
        let cur = new Date(start);
        while (cur < end) {
            const dateStr = format(cur, 'yyyy-MM-dd');
            // dailyPriceMap[date][type] is now {price, isBlocked}
            if (dailyPriceMap[dateStr]?.[room.type]?.isBlocked) {
                return true;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return false;
    };

    // Whether the check-in date has a custom price for a room type
    const getCheckInOverridePrice = (room) => {
        // dailyPriceMap[date][type] is {price, isBlocked}
        const entry = dailyPriceMap[checkIn]?.[room?.type];
        return entry !== undefined ? entry.price : undefined;
    };

    const handleRoomSelect = (room) => {
        if (!room) return;
        
        // Calculate if we need more rooms for current guest count
        const maxOccupancy = room.maxOccupancy || 6;
        let newRooms = Math.max(rooms, Math.ceil(guests / maxOccupancy));
        // Clamp to what's available for this new room type
        newRooms = Math.min(newRooms, room.available || 1);
        
        setRoomsValue(newRooms);
        setRooms(newRooms);

        // Clamp guests to this room's max occupancy * (new) rooms
        const maxGuestsForNewRooms = maxOccupancy * newRooms;
        const nextGuests = Math.min(guests || 1, maxGuestsForNewRooms);
        setGuestsValue(nextGuests);
        setGuests(nextGuests);

        setSelectedRoom(room);
        selectRoom({
            ...room,
            _stayTotal: computeStayTotal(room, newRooms, nextGuests)
        });
    };

    // Calculate total nights and per-night breakdown
    const totalNights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));

    // Compute the total stay price by summing each night's effective room price
    const computeStayTotal = (room, currentRooms = rooms, currentGuests = guests) => {
        if (!room) return 0;
        const baseGuestsPerRoom = room.baseGuests || room.maxOccupancy || 1;
        const totalBaseGuests = baseGuestsPerRoom * currentRooms;
        const extraGuestFee = room.extraGuestPrice || 0;
        const extra = Math.max(0, (currentGuests || 1) - totalBaseGuests);
        let total = 0;
        const start = new Date(checkIn + 'T00:00:00');
        for (let i = 0; i < totalNights; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            // Use local date string (avoids UTC offset bugs in IST etc.)
            const y = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${mo}-${dy}`;
            const nightPrice = getEffectivePrice(room, dateStr) * currentRooms;
            total += nightPrice + extra * extraGuestFee;
        }
        return total;
    };



    const handleBookNow = () => {
        if (hasBlockedDates) {
            alert('Your selected dates include dates where the lodge is fully booked or unavailable. Please select different dates.');
            return;
        }
        if (selectedRoom) {
            const stayTotal = computeStayTotal(selectedRoom);
            // Store room with a special totalOverride so Booking.jsx can use the correct amount
            selectRoom({ ...selectedRoom, _stayTotal: stayTotal });
            setDates(new Date(checkIn), new Date(checkOut));
            setRooms(rooms);
            setGuests(guests);
            navigate('/booking');
        }
    };

    const baseGuests = selectedRoom ? (selectedRoom.baseGuests || selectedRoom.maxOccupancy || 1) : 1;
    const totalBaseGuests = baseGuests * rooms;
    const extraGuestPrice = selectedRoom?.extraGuestPrice || 0;
    const extraGuests = selectedRoom ? Math.max(0, (guests || 1) - totalBaseGuests) : 0;
    const totalPrice = selectedRoom ? computeStayTotal(selectedRoom) : 0;

    // Max guests allowed for current selected room configuration (limit to 10 rooms/60 guests)
    const maxGuestsForSelectedRoom = (selectedRoom?.maxOccupancy || 6) * rooms;

    const getGoogleMapsUrl = () => {
        return `https://www.google.com/maps/search/?api=1&query=Sri+Raghavendra+Swamy+Mutt+Mantralayam`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar - Mobile */}
            <div className="md:hidden bg-white sticky top-16 z-40 border-b border-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}
                        >
                            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button className="p-2 text-gray-600">
                            <Share2 size={24} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                {/* Breadcrumb */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-primary-600">Home</Link>
                    <span>/</span>
                    <Link to="/lodges" className="hover:text-primary-600">Lodges</Link>
                    <span>/</span>
                    <span className="text-gray-900">{lodge.name}</span>
                </div>

                {/* Photo Gallery */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <PhotoGallery images={lodge.images} lodgeName={lodge.name} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Lodge Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-soft mb-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        {lodge.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={16} className="text-primary-500" />
                                            {lodge.distance} from Mutt
                                        </span>
                                        <span className={`badge-distance ${lodge.distanceType === 'walkable'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {lodge.distanceType === 'walkable' ? 'Walking Distance' : 'Auto Distance'}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`p-3 rounded-xl border-2 transition-all ${isFavorite
                                            ? 'border-red-500 text-red-500 bg-red-50'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className="p-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Rating & Reviews */}
                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                                    <Star size={18} className="text-green-600 fill-green-600" />
                                    <span className="font-semibold text-green-700">{lodge.rating}</span>
                                </div>
                                <span className="text-gray-600">{lodge.reviewCount} reviews</span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 leading-relaxed">
                                {lodge.description}
                            </p>
                        </motion.div>

                        {/* Booking Card for Mobile ONLY */}
                        <div className="block lg:hidden mb-6 bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Check Availability</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={checkIn}
                                            min={format(today, 'yyyy-MM-dd')}
                                            onChange={(e) => {
                                                setCheckIn(e.target.value);
                                                if (new Date(e.target.value) >= new Date(checkOut)) {
                                                    setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                                                }
                                            }}
                                            className="w-full pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={checkOut}
                                            min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Rooms</label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select
                                            value={rooms}
                                            onChange={(e) => {
                                                const r = Number(e.target.value);
                                                setRoomsValue(r);
                                                setRooms(r);
                                                if (selectedRoom) {
                                                    const maxG = (selectedRoom.maxOccupancy || 6) * r;
                                                    if (guests > maxG) {
                                                        setGuestsValue(maxG);
                                                        setGuests(maxG);
                                                    }
                                                }
                                            }}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 appearance-none"
                                        >
                                            {Array.from({ length: selectedRoom ? Math.min(8, selectedRoom.available) : 8 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Guests</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select
                                            value={guests}
                                            onChange={(e) => {
                                                const g = Number(e.target.value);
                                                setGuestsValue(g);
                                                setGuests(g);
                                                if (selectedRoom) {
                                                    const minR = Math.ceil(g / (selectedRoom.maxOccupancy || 6));
                                                    if (rooms < minR) {
                                                        const cappedR = Math.min(minR, selectedRoom.available);
                                                        setRoomsValue(cappedR);
                                                        setRooms(cappedR);
                                                        // Re-check guest count after room cap
                                                        const maxAllowedG = cappedR * (selectedRoom.maxOccupancy || 6);
                                                        if (g > maxAllowedG) {
                                                            setGuestsValue(maxAllowedG);
                                                            setGuests(maxAllowedG);
                                                        }
                                                    }
                                                }
                                            }}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 appearance-none"
                                        >
                                            {Array.from({ length: selectedRoom ? maxGuestsForSelectedRoom : 16 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={checkAvailability}
                                disabled={availabilityLoading}
                                className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {availabilityLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                                {availabilityLoading ? 'Checking...' : 'Check Availability'}
                            </button>
                        </div>

                        {/* Room Types */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 shadow-soft mb-6"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Select a Room
                            </h2>
                            {availabilityLoading ? (
                                <div className="flex items-center justify-center py-10 gap-3 text-primary-600">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="text-sm font-medium">Checking availability...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {lodge.rooms && lodge.rooms.length > 0 ? (
                                        lodge.rooms.map((room, index) => (
                                            <RoomCard
                                                key={room._id || index}
                                                room={room}
                                                overridePrice={getCheckInOverridePrice(room)}
                                                isBlockedForDates={isRoomTypeBlocked(room)}
                                                onSelect={handleRoomSelect}
                                                isSelected={selectedRoom?._id === room._id}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No rooms available</p>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Amenities */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 shadow-soft mb-6"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Amenities
                            </h2>
                            <AmenityList amenities={lodge.amenities} />
                        </motion.div>

                        {/* Reviews */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <ReviewsSection slug={lodge.slug} />
                        </motion.div>

                        {/* Location */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl p-6 shadow-soft"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Location
                            </h2>
                            <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3838.8051981089815!2d77.37599!3d15.98683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb5e5d7a6e5e5e5%3A0x5e5e5e5e5e5e5e5e!2sSri%20Raghavendra%20Swamy%20Mutt!5e0!3m2!1sen!2sin!4v1234567890"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Lodge Location"
                                />
                            </div>
                            <p className="text-gray-600 mb-4">
                                <MapPin size={16} className="inline mr-2 text-primary-500" />
                                {lodge.address}
                            </p>
                            <a
                                href={getGoogleMapsUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <Navigation size={18} />
                                Get Directions
                            </a>
                        </motion.div>
                    </div>

                    {/* Sidebar - Booking Card */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl p-6 shadow-elevated"
                            >
                                {/* Price */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <p className="text-sm text-gray-500">Starting from</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900">₹{lodge.priceStarting}</span>
                                        <span className="text-gray-500">/ night</span>
                                    </div>
                                </div>

                                {/* Date Picker */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={checkIn}
                                                    min={format(today, 'yyyy-MM-dd')}
                                                    onChange={(e) => {
                                                        setCheckIn(e.target.value);
                                                        if (new Date(e.target.value) >= new Date(checkOut)) {
                                                            setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                                                        }
                                                    }}
                                                    className="w-full pl-9 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={checkOut}
                                                    min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
                                                    onChange={(e) => setCheckOut(e.target.value)}
                                                    className="w-full pl-9 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Rooms</label>
                                            <div className="relative">
                                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    value={rooms}
                                                    onChange={(e) => {
                                                        const r = Number(e.target.value);
                                                        setRoomsValue(r);
                                                        setRooms(r);
                                                        if (selectedRoom) {
                                                            const maxG = (selectedRoom.maxOccupancy || 6) * r;
                                                            if (guests > maxG) {
                                                                setGuestsValue(maxG);
                                                                setGuests(maxG);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                                                >
                                                    {Array.from({ length: selectedRoom ? Math.min(8, selectedRoom.available) : 8 }, (_, i) => i + 1).map(num => (
                                                        <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Guests</label>
                                            <div className="relative">
                                                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    value={guests}
                                                    onChange={(e) => {
                                                        const g = Number(e.target.value);
                                                        setGuestsValue(g);
                                                        setGuests(g);
                                                        if (selectedRoom) {
                                                            const minR = Math.ceil(g / (selectedRoom.maxOccupancy || 6));
                                                            if (rooms < minR) {
                                                                const cappedR = Math.min(minR, selectedRoom.available);
                                                                setRoomsValue(cappedR);
                                                                setRooms(cappedR);
                                                                // Re-check guest count after room cap
                                                                const maxAllowedG = cappedR * (selectedRoom.maxOccupancy || 6);
                                                                if (g > maxAllowedG) {
                                                                    setGuestsValue(maxAllowedG);
                                                                    setGuests(maxAllowedG);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                                                >
                                                    {Array.from({ length: selectedRoom ? maxGuestsForSelectedRoom : 16 }, (_, i) => i + 1).map(num => (
                                                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {selectedRoom && (
                                            <p className="text-xs text-gray-600">
                                                {totalBaseGuests > 1 ? `${totalBaseGuests} guests included` : `${totalBaseGuests} guest included`} across {rooms} {rooms === 1 ? 'room' : 'rooms'}
                                                {extraGuestPrice > 0 && ` • ₹${extraGuestPrice} per extra guest`}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1.5 text-center">
                                            {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={checkAvailability}
                                        disabled={availabilityLoading}
                                        className="mt-3 w-full py-2.5 rounded-lg border-2 border-primary-500 text-primary-600 hover:bg-primary-50 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {availabilityLoading ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                                        {availabilityLoading ? 'Checking...' : 'Check Availability'}
                                    </button>
                                </div>

                                {/* Selected Room */}
                                {selectedRoom && (
                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Room</p>
                                        <div className="p-3 bg-primary-50 rounded-xl">
                                            <p className="font-semibold text-gray-900 mb-1">{selectedRoom.name}</p>
                                            <div className="space-y-0.5 text-sm text-gray-700">
                                                <div className="flex justify-between">
                                                    <span>Room ({totalBaseGuests > 1 ? `${totalBaseGuests} guests` : `${totalBaseGuests} guest`}) × {rooms}</span>
                                                    <span>
                                                        {dailyPriceMap[checkIn]?.[selectedRoom.type]?.price != null &&
                                                            dailyPriceMap[checkIn]?.[selectedRoom.type]?.price !== selectedRoom.price && (
                                                            <span className="line-through text-gray-400 mr-1 text-xs">₹{selectedRoom.price * rooms}</span>
                                                        )}
                                                        ₹{getEffectivePrice(selectedRoom) * rooms}
                                                    </span>
                                                </div>
                                                {extraGuests > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Extra guests ({extraGuests})</span>
                                                        <span>₹{extraGuests * extraGuestPrice}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-semibold text-primary-600 pt-1 border-t border-primary-200">
                                                    <span>Per night × {totalNights}</span>
                                                    <span>₹{totalPrice}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Booking Button */}
                                {hasBlockedDates && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                                        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                                        <p>The lodge is fully booked or unavailable on one or more of your selected dates.</p>
                                    </div>
                                )}
                                <button
                                    onClick={handleBookNow}
                                    disabled={!selectedRoom || hasBlockedDates}
                                    className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${selectedRoom && !hasBlockedDates
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] animate-pulse hover:animate-none'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {hasBlockedDates ? 'Dates Unavailable' : (selectedRoom ? `Book Now • ₹${totalPrice}` : 'Select a Room to Book')}
                                </button>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <a
                                        href={`tel:${lodge.phone}`}
                                        className="btn-call py-3 text-sm justify-center"
                                    >
                                        <Phone size={18} />
                                        Call
                                    </a>
                                    <a
                                        href={`https://wa.me/${lodge.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi, I want to book a room at ${lodge.name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-whatsapp py-3 text-sm justify-center"
                                    >
                                        <MessageCircle size={18} />
                                        WhatsApp
                                    </a>
                                </div>

                                {/* Info */}
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Clock size={18} className="text-gray-400" />
                                        <span>Check-in: 12:00 PM | Check-out: 11:00 AM</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Users size={18} className="text-gray-400" />
                                        <span>ID proof required at check-in</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Mobile Sticky Footer */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">
                            {selectedRoom ? `${rooms}x ${selectedRoom.name} - ${totalNights} night${totalNights > 1 ? 's' : ''}` : 'Starting from'}
                        </p>
                        <p className="text-xl font-bold font-mono text-gray-900">
                            ₹{selectedRoom ? totalPrice : lodge.priceStarting}
                            {!selectedRoom && <span className="text-sm font-sans font-normal text-gray-500">/night</span>}
                        </p>
                    </div>
                    <button
                        onClick={handleBookNow}
                        disabled={!selectedRoom || hasBlockedDates}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${selectedRoom && !hasBlockedDates
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg active:scale-95'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {hasBlockedDates ? 'Unavailable' : (selectedRoom ? 'Book Now' : 'Select Room')}
                    </button>
                </div>
            </div>

            {/* Mobile Footer Spacer */}
            < div className="md:hidden h-20" />
        </div >
    );
};

export default LodgeDetail;
