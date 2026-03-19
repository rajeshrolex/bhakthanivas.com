import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SlidersHorizontal,
    X,
    ChevronDown,
    MapPin,
    Grid3X3,
    List,
    Loader2
} from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import LodgeCard from '../components/lodge/LodgeCard';
import { lodgeAPI } from '../services/api';
import { sortOptions } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { format } from 'date-fns';

const LodgeList = () => {
    const [searchParams] = useSearchParams();
    const { setGuests, setRooms, bookingData } = useBooking();
    const [lodges, setLodges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('popularity');
    const [showFilters, setShowFilters] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState({
        distanceType: searchParams.get('distance') || '',
        priceMax: '',
        availability: '',
        amenities: []
    });

    // Fetch lodges from API
    useEffect(() => {
        const fetchLodges = async () => {
            try {
                setLoading(true);
                const data = await lodgeAPI.getAll();
                setLodges(data);
            } catch (error) {
                console.error('Error fetching lodges:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLodges();
    }, []);

    // Sync URL parameters with booking context
    useEffect(() => {
        const roomsParam = searchParams.get('rooms');
        const guestsParam = searchParams.get('guests');
        if (roomsParam) {
            setRooms(Number(roomsParam));
        }
        if (guestsParam) {
            setGuests(Number(guestsParam));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Apply filters and sorting locally
    const filteredLodges = useMemo(() => {
        let result = lodges.filter(lodge => !lodge.isBlocked);

        // Filter out lodges that are blocked on any of the selected dates
        const checkInParam = searchParams.get('checkIn') || bookingData?.checkIn;
        const checkOutParam = searchParams.get('checkOut') || bookingData?.checkOut;

        if (checkInParam && checkOutParam) {
            // Generate array of date strings for the stay
            const stayDates = [];
            // Parse check-in as local midnight to avoid UTC shift dropping a day
            let currentDate = new Date(checkInParam + 'T00:00:00');
            const endDate = new Date(checkOutParam + 'T00:00:00');

            while (currentDate < endDate) {
                stayDates.push(format(currentDate, 'yyyy-MM-dd'));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Keep lodge only if NONE of its blockedDates intersect with stayDates
            result = result.filter(lodge => {
                if (!lodge.blockedDates || lodge.blockedDates.length === 0) return true;
                return !stayDates.some(dateStr => lodge.blockedDates.includes(dateStr));
            });
        } else {
            // No dates selected — always hide lodges blocked on today's date
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            result = result.filter(lodge => {
                if (!lodge.blockedDates || lodge.blockedDates.length === 0) return true;
                return !lodge.blockedDates.includes(todayStr);
            });
        }

        // Filter by distance type
        if (filters.distanceType) {
            result = result.filter(lodge => lodge.distanceType === filters.distanceType);
        }

        // Filter by max price
        if (filters.priceMax) {
            result = result.filter(lodge => lodge.priceStarting <= parseInt(filters.priceMax));
        }

        // Filter by availability
        if (filters.availability && filters.availability !== 'all') {
            result = result.filter(lodge => lodge.availability === filters.availability);
        }

        // Sort
        switch (sortBy) {
            case 'priceLow':
                result.sort((a, b) => a.priceStarting - b.priceStarting);
                break;
            case 'priceHigh':
                result.sort((a, b) => b.priceStarting - a.priceStarting);
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'distance':
                result.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
                break;
            default:
                result.sort((a, b) => b.reviewCount - a.reviewCount);
        }

        return result;
    }, [lodges, filters, sortBy]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            distanceType: '',
            priceMax: '',
            availability: '',
            amenities: []
        });
    };

    const activeFilterCount = Object.values(filters).filter(v =>
        v && (Array.isArray(v) ? v.length > 0 : true)
    ).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading lodges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white shadow-sm sticky top-14 sm:top-16 md:top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Search Bar - Compact */}
                    <div className="mb-4">
                        <SearchBar variant="compact" />
                    </div>

                    {/* Filters & Sort Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${showFilters || activeFilterCount > 0
                                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                            >
                                <SlidersHorizontal size={18} />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-5 h-5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Quick Filter Pills */}
                            <div className="hidden md:flex items-center gap-2">
                                <button
                                    onClick={() => handleFilterChange('distanceType', filters.distanceType === 'walkable' ? '' : 'walkable')}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.distanceType === 'walkable'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <MapPin size={14} className="inline mr-1" />
                                    Walking Distance
                                </button>
                                <button
                                    onClick={() => handleFilterChange('availability', filters.availability === 'available' ? '' : 'available')}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.availability === 'available'
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Available Now
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                                >
                                    <span className="hidden sm:inline">Sort:</span>
                                    <span className="text-gray-900">
                                        {sortOptions.find(o => o.value === sortBy)?.label}
                                    </span>
                                    <ChevronDown size={16} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showSortDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden z-20"
                                        >
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setShowSortDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${sortBy === option.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* View Toggle */}
                            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                                        }`}
                                >
                                    <Grid3X3 size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                                        }`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-b border-gray-200 overflow-hidden"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Distance Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Distance from Mutt
                                    </label>
                                    <select
                                        value={filters.distanceType}
                                        onChange={(e) => handleFilterChange('distanceType', e.target.value)}
                                        className="input-primary"
                                    >
                                        <option value="">All Distances</option>
                                        <option value="walkable">Walking Distance (&lt;500m)</option>
                                        <option value="auto">Auto Distance (&gt;500m)</option>
                                    </select>
                                </div>

                                {/* Price Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Price per Night
                                    </label>
                                    <select
                                        value={filters.priceMax}
                                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                        className="input-primary"
                                    >
                                        <option value="">Any Price</option>
                                        <option value="500">Under ₹500</option>
                                        <option value="1000">Under ₹1000</option>
                                        <option value="1500">Under ₹1500</option>
                                        <option value="2000">Under ₹2000</option>
                                    </select>
                                </div>

                                {/* Availability Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Availability
                                    </label>
                                    <select
                                        value={filters.availability}
                                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                                        className="input-primary"
                                    >
                                        <option value="">All</option>
                                        <option value="available">Available Now</option>
                                        <option value="limited">Limited Rooms</option>
                                    </select>
                                </div>

                                {/* Clear Filters */}
                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X size={18} />
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Count */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Bhakta Nivas: Private Lodges in Mantralayam
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Near Sri Raghavendra Swamy Mutt
                    </p>
                </div>

                {/* Lodge Grid */}
                {filteredLodges.length > 0 ? (
                    <div className={`grid gap-6 ${viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                        }`}>
                        {filteredLodges.map((lodge, index) => (
                            <LodgeCard key={lodge._id || lodge.id} lodge={lodge} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No lodges match your filters
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your filters to see more results
                        </p>
                        <button
                            onClick={clearFilters}
                            className="btn-primary"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LodgeList;
