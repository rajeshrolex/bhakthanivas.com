import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Users,
    Search,
    MapPin
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useBooking } from '../../context/BookingContext';
import GuestDetailsModal from './GuestDetailsModal';

const SearchWidget = ({ className = '' }) => {
    const navigate = useNavigate();
    const { setDates, setGuests, setRooms } = useBooking();

    const today = new Date();
    const tomorrow = addDays(today, 1);

    // State for inputs
    const [location, setLocation] = useState('Mantralayam');
    const [checkIn, setCheckIn] = useState(format(today, 'yyyy-MM-dd'));
    const [checkOut, setCheckOut] = useState(format(tomorrow, 'yyyy-MM-dd'));
    const [rooms, setRoomValue] = useState(1);
    const [guests, setGuestValue] = useState(2);

    // Refs for date inputs to trigger picker programmatically
    const checkInRef = useRef(null);
    const checkOutRef = useRef(null);

    // UI States
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

    const handleSearch = () => {
        setDates(new Date(checkIn), new Date(checkOut));
        setGuests(guests);
        setRooms(rooms);

        if (rooms === 2 && guests === 4) {
            navigate('/lodge/yatri-nivas-by-swamy');
            return;
        }

        const params = new URLSearchParams();
        params.append('location', location);
        params.append('checkIn', checkIn);
        params.append('checkOut', checkOut);
        params.append('guests', guests);
        params.append('rooms', rooms);

        navigate(`/lodges?${params.toString()}`);
    };

    return (
        <div className={`w-full max-w-sm mx-auto bg-white rounded-3xl shadow-xl overflow-hidden p-3 sm:p-4 ${className}`}>
            <div className="space-y-2 sm:space-y-3">
                {/* Location Input */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-blue-50/50 hover:bg-blue-50 focus:bg-white border-none py-2.5 sm:py-3.5 pl-12 pr-12 rounded-full text-gray-900 font-medium placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm sm:text-base"
                        placeholder="Search location"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5 cursor-pointer transition-colors">
                        <MapPin className="text-gray-700 w-5 h-5" />
                    </div>
                </div>

                {/* Date Inputs - Row of pills */}
                <div className="flex gap-2 sm:gap-3">
                    <div
                        onClick={() => checkInRef.current?.showPicker()}
                        className="flex-1 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-2.5 sm:p-3 flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer relative"
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{format(new Date(checkIn), 'EEE, MMM d')}</span>
                        <input
                            ref={checkInRef}
                            type="date"
                            value={checkIn}
                            min={format(today, 'yyyy-MM-dd')}
                            onChange={(e) => {
                                setCheckIn(e.target.value);
                                if (new Date(e.target.value) >= new Date(checkOut)) {
                                    setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                                }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    <div
                        onClick={() => checkOutRef.current?.showPicker()}
                        className="flex-1 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-2.5 sm:p-3 flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer relative"
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{format(new Date(checkOut), 'EEE, MMM d')}</span>
                        <input
                            ref={checkOutRef}
                            type="date"
                            value={checkOut}
                            min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                    </div>
                </div>

                {/* Guests/Rooms Input */}
                <button
                    onClick={() => setIsGuestModalOpen(true)}
                    className="w-full bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-3 transition-colors text-left"
                >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    <span className="text-gray-900 font-medium text-xs sm:text-sm">
                        {rooms} {rooms === 1 ? 'room' : 'rooms'} {guests} {guests === 1 ? 'guest' : 'guests'}
                    </span>
                </button>

                {/* Actions Row */}
                <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                    <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        onClick={handleSearch}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full py-2.5 sm:py-3.5 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] text-sm sm:text-base"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Guest Details Modal */}
            <GuestDetailsModal
                isOpen={isGuestModalOpen}
                onClose={() => setIsGuestModalOpen(false)}
                rooms={rooms}
                setRooms={setRoomValue}
                guests={guests}
                setGuests={setGuestValue}
            />
        </div>
    );
};

export default SearchWidget;
