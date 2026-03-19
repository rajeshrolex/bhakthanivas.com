import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Star,
    MapPin,
    Wifi,
    Car,
    Droplets,
    Wind,
    Zap
} from 'lucide-react';

import { getImageUrl } from '../../services/api';

const LodgeCard = ({ lodge, index = 0 }) => {
    const navigate = useNavigate();
    const {
        name,
        slug,
        images = [],
        distance,
        distanceType,
        rating,
        reviewCount,
        priceStarting,
        availability,
        amenities = [],
        rooms = []
    } = lodge;

    // Fallback image if no images available
    const rawImage = images.length > 0 ? images[0] : null;
    const displayImage = getImageUrl(rawImage);

    // Calculate availability from rooms if rooms exist
    const calculateAvailability = () => {
        if (rooms && rooms.length > 0) {
            const totalAvailable = rooms.reduce((sum, room) => sum + (room.available || 0), 0);
            if (totalAvailable === 0) return 'full';
            if (totalAvailable <= 5) return 'limited';
            return 'available';
        }
        return availability || 'available';
    };

    const computedAvailability = calculateAvailability();

    const getAvailabilityBadge = () => {
        switch (computedAvailability) {
            case 'available':
                return <span className="badge-available">Available</span>;
            case 'limited':
                return <span className="badge-limited">Limited Rooms</span>;
            case 'full':
                return <span className="badge-full">Fully Booked</span>;
            default:
                return null;
        }
    };

    const getDistanceBadge = () => {
        return (
            <span className={`badge-distance ${distanceType === 'walkable' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                <MapPin size={12} className="mr-1" />
                {distance} • {distanceType === 'walkable' ? 'Walking distance' : 'Auto distance'}
            </span>
        );
    };

    const amenityIcons = {
        wifi: Wifi,
        parking: Car,
        hotWater: Droplets,
        ac: Wind,
        powerBackup: Zap
    };

    return (
        <motion.div
            onClick={() => navigate(`/lodge/${slug}`)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden block h-full flex flex-col cursor-pointer"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={displayImage}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {getAvailabilityBadge()}
                    {rating >= 4.5 && (
                        <div className="flex items-center gap-1 bg-yellow-400 text-yellow-950 px-2 py-1 rounded-full text-[10px] font-bold shadow-md">
                            <Star size={10} className="fill-current" />
                            Trusted by Devotees
                        </div>
                    )}
                </div>

                <div className="absolute top-3 right-3">
                    {getDistanceBadge()}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Title */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {name}
                    </h3>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                        <span>{rating}</span>
                        <Star size={10} className="fill-current" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        ({reviewCount} reviews)
                    </span>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                        {(Array.isArray(amenities) ? amenities : []).slice(0, 3).map((amenity, i) => {
                            const Icon = amenityIcons[amenity];
                            return Icon ? (
                                <div key={i} className="w-6 h-6 rounded-full bg-gray-50 border border-white flex items-center justify-center text-gray-400">
                                    <Icon size={12} />
                                </div>
                            ) : null;
                        })}
                    </div>
                    {Array.isArray(amenities) && amenities.length > 3 && (
                        <span className="text-xs text-gray-500 font-medium">
                            +{amenities.length - 3} more
                        </span>
                    )}
                </div>

                {/* Price & Action */}
                <div className="flex items-end justify-between pt-3 border-t border-dashed border-gray-100">
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Starting from</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-900">₹{priceStarting}</span>
                            <span className="text-xs text-gray-400">/night</span>
                        </div>
                    </div>

                    <span
                        className="px-6 py-2 bg-primary-600 group-hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors text-center relative z-20 pointer-events-none"
                    >
                        View
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default LodgeCard;
