import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    Users,
    Search,
    ChevronDown,
    MapPin
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useBooking } from '../../context/BookingContext';

const SearchBar = ({ variant = 'default', className = '' }) => {
    const navigate = useNavigate();
    const { setDates, setGuests } = useBooking();
    const [searchParams] = useSearchParams();
    const isHero = variant === 'hero'; // Defined at top

    const today = new Date();
    const tomorrow = addDays(today, 1);

    // Initialize state from URL params if available, otherwise defaults
    const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || format(today, 'yyyy-MM-dd'));
    const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || format(tomorrow, 'yyyy-MM-dd'));
    const [guests, setGuestsValue] = useState(parseInt(searchParams.get('guests')) || 1);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    // Default expanded on hero (Home), collapsed on others
    const [isExpanded, setIsExpanded] = useState(isHero);

    // Toggle for mobile
    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleSearch = () => {
        setDates(new Date(checkIn), new Date(checkOut));
        setGuests(guests);
        navigate(`/lodges?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
        if (!isHero) setIsExpanded(false); // Collapse after search on listing page
    };

    return (
        <div className={`${className}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`
          ${isHero
                        ? 'bg-white rounded-2xl shadow-elevated p-3 md:p-6'
                        : 'bg-white rounded-xl shadow-card p-3 md:p-4'
                    }
        `}
            >
                {/* Mobile Header / Toggle */}
                <div className="md:hidden flex items-center justify-between mb-2">
                    {!isExpanded ? (
                        <div onClick={() => setIsExpanded(true)} className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <Calendar size={16} className="text-primary-500" />
                            <span>
                                {format(new Date(checkIn), 'dd MMM')} - {format(new Date(checkOut), 'dd MMM')}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>{guests} Guest{guests > 1 && 's'}</span>
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-gray-500">Search Lodges</span>
                    )}

                    <button
                        onClick={toggleExpand}
                        className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="rotate-180 transition-transform" size={18} /> : <ChevronDown className="transition-transform" size={18} />}
                    </button>
                </div>

                {/* Collapsible Content */}
                <motion.div
                    initial={false}
                    animate={{ height: isExpanded || window.innerWidth >= 768 ? 'auto' : 0, opacity: isExpanded || window.innerWidth >= 768 ? 1 : 0 }}
                    className="overflow-hidden md:overflow-visible md:h-auto md:opacity-100"
                >
                    <div className={`
              grid gap-2 md:gap-4
              grid-cols-2 md:grid-cols-4
            `}>
                        {/* Location - Full width on mobile, 1 col on desktop */}
                        <div className="col-span-2 md:col-span-1 relative">
                            <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1">
                                Location
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-gray-50 rounded-lg md:rounded-xl text-gray-700">
                                <MapPin size={16} className="text-primary-500" />
                                <span className="font-medium text-sm">Mantralayam</span>
                            </div>
                        </div>

                        {/* Check-in Date */}
                        <div className="col-span-1 relative">
                            <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1">
                                Check-in
                            </label>
                            <div className="relative">
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
                                    className="w-full pl-2 pr-1 py-2 md:pl-10 md:pr-4 md:py-3 bg-gray-50 border-0 rounded-lg md:rounded-xl text-gray-700 font-medium text-xs md:text-base focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Check-out Date */}
                        <div className="col-span-1 relative">
                            <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1">
                                Check-out
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={checkOut}
                                    min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    className="w-full pl-2 pr-1 py-2 md:pl-10 md:pr-4 md:py-3 bg-gray-50 border-0 rounded-lg md:rounded-xl text-gray-700 font-medium text-xs md:text-base focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Guests - Share row with button on mobile */}
                        <div className="col-span-1 relative">
                            <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1">
                                Guests
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                                    className="w-full flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-gray-50 rounded-lg md:rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors text-xs md:text-base"
                                >
                                    <span className="flex items-center gap-1 md:gap-2 truncate">
                                        <Users size={16} className="text-gray-400 hidden md:block" />
                                        {guests} <span className="md:inline">Guest{guests > 1 && 's'}</span>
                                    </span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Guest Dropdown */}
                                {showGuestDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-20"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => {
                                                    setGuestsValue(num);
                                                    setShowGuestDropdown(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${guests === num ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                                                    }`}
                                            >
                                                {num} Guest{num > 1 && 's'}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Search Button - Integrated into grid */}
                        <div className="col-span-1 md:hidden flex items-end">
                            <button
                                onClick={handleSearch}
                                className="w-full h-[42px] flex items-center justify-center gap-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-lg active:scale-95 transition-all text-xs"
                            >
                                <Search size={16} />
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Desktop Search Button - Full Width below grid */}
                    <div className="hidden md:block">
                        <button
                            onClick={handleSearch}
                            className={`
                  w-full mt-4 flex items-center justify-center gap-2 
                  bg-gradient-to-r from-primary-500 to-primary-600 
                  hover:from-primary-600 hover:to-primary-700 
                  text-white font-semibold rounded-xl 
                  shadow-lg hover:shadow-xl 
                  transition-all duration-300 
                  transform hover:scale-[1.02] active:scale-[0.98]
                  py-4 text-base
                `}
                        >
                            <Search size={20} />
                            Search Lodges
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SearchBar;
