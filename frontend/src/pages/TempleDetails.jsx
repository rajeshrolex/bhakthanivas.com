import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin,
    Clock,
    Star,
    Train,
    Bus,
    Navigation,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Info
} from 'lucide-react';
import { templeAPI, getImageUrl } from '../services/api';

const TempleDetails = () => {
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState({});

    useEffect(() => {
        const fetchTemples = async () => {
            try {
                const data = await templeAPI.getAll();
                setTemples(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching temples:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemples();
    }, []);

    const nextImage = (templeId, total) => {
        setActiveImage(prev => ({
            ...prev,
            [templeId]: ((prev[templeId] || 0) + 1) % total
        }));
    };

    const prevImage = (templeId, total) => {
        setActiveImage(prev => ({
            ...prev,
            [templeId]: ((prev[templeId] || 0) - 1 + total) % total
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    if (temples.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4">
                <Info size={48} className="mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-2">No Temple Details Available</h2>
                <p className="text-sm">Temple information will be updated soon. Please check back later.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white py-12 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold mb-3"
                    >
                        🙏 Temple Details
                    </motion.h1>
                    <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto">
                        Complete information about temples, darshan timings, and how to reach
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
                {temples.map((temple, idx) => (
                    <motion.div
                        key={temple._id || idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                    >
                        {/* Image Gallery */}
                        {temple.images && temple.images.length > 0 && (
                            <div className="relative h-64 sm:h-80 bg-gray-100">
                                <img
                                    src={getImageUrl(temple.images[activeImage[temple._id] || 0])}
                                    alt={temple.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/400x300?text=No+Image';
                                    }}
                                />
                                {temple.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => prevImage(temple._id, temple.images.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={() => nextImage(temple._id, temple.images.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {temple.images.map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full transition-all ${(activeImage[temple._id] || 0) === i
                                                        ? 'bg-white w-4'
                                                        : 'bg-white/50'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 sm:p-10">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                                        {temple.name}
                                    </h2>
                                    {temple.location && (
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <MapPin size={18} className="text-primary-500" />
                                            <span>{temple.location}</span>
                                        </div>
                                    )}
                                </div>
                                {temple.distance && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-semibold whitespace-nowrap border border-indigo-100 shadow-sm">
                                        <Navigation size={16} />
                                        {temple.distance}
                                    </div>
                                )}
                            </div>

                            {temple.description && (
                                <p className="text-gray-600 text-lg leading-relaxed mb-8 border-l-4 border-primary-400 pl-4">
                                    {temple.description}
                                </p>
                            )}

                            {/* Info Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                {/* Darshan Block */}
                                {temple.darshanTimings && (
                                    <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-200/60 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                                <Clock size={20} />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Darshan Timings</h3>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{temple.darshanTimings}</p>
                                    </motion.div>
                                )}

                                {/* Special Darshan Block */}
                                {temple.specialDarshanTimings && (
                                    <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200/60 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                <Star size={20} />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Special / VIP Darshan</h3>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{temple.specialDarshanTimings}</p>
                                    </motion.div>
                                )}

                                {/* Railway / Transport Block (Custom Title) */}
                                {temple.nearbyRailwayStation && (
                                    <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/60 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {temple.nearbyRailwayStationTitle || 'Nearby Railway Station'}
                                            </h3>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{temple.nearbyRailwayStation}</p>
                                    </motion.div>
                                )}

                                {/* Bus / Custom Sightseeing Block (Custom Title) */}
                                {temple.busTimings && (
                                    <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200/60 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {temple.busTimingsTitle || 'Bus Timings & Local Transport'}
                                            </h3>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{temple.busTimings}</p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Additional Information Full Width */}
                            {temple.additionalInfo && (
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/60 shadow-sm mb-8">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                            <Info size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Additional Information & Locker Points</h3>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{temple.additionalInfo}</p>
                                </motion.div>
                            )}

                            {/* Actions / Maps */}
                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                {temple.googleMapsLink && (
                                    <a
                                        href={temple.googleMapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Navigation size={18} />
                                        Open in Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default TempleDetails;
