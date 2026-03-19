import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Check,
    Wifi,
    Droplets,
    Wind,
    Tv,
    GlassWater,
    Bed,
    Lock
} from 'lucide-react';

const RoomCard = ({ room, onSelect, isSelected = false, overridePrice, isBlockedForDates = false }) => {
    const {
        type,
        name,
        price,
        baseGuests,
        extraGuestPrice,
        maxOccupancy,
        available,
        amenities = []
    } = room;

    const displayPrice = overridePrice != null ? overridePrice : price;
    const hasOverride = overridePrice != null && overridePrice !== price;

    const amenityIcons = {
        wifi: { icon: Wifi, label: 'WiFi' },
        hotWater: { icon: Droplets, label: 'Hot Water' },
        ac: { icon: Wind, label: 'AC' },
        tv: { icon: Tv, label: 'TV' },
        minibar: { icon: GlassWater, label: 'Mini Bar' },
        extraBed: { icon: Bed, label: 'Extra Bed' },
        locker: { icon: Lock, label: 'Locker' }
    };

    const getRoomTypeBadge = () => {
        const colors = {
            'Non-AC': 'bg-gray-100 text-gray-700',
            'AC': 'bg-blue-100 text-blue-700',
            'Family': 'bg-purple-100 text-purple-700',
            'Dormitory': 'bg-green-100 text-green-700'
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const isAvailable = available > 0 && !isBlockedForDates;

    // Badge Logic
    const isBestValue = name.toLowerCase().includes('standard') || name.toLowerCase().includes('budget');
    const isPopular = name.toLowerCase().includes('ac') && !name.toLowerCase().includes('non');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
        relative p-4 rounded-xl border-2 transition-all duration-200
        ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-lg ring-1 ring-primary-500'
                    : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
                }
        ${!isAvailable ? 'opacity-60' : ''}
      `}
        >
            {/* Badges */}
            {isBestValue && !isSelected && (
                <div className="absolute -top-3 left-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    BEST VALUE
                </div>
            )}
            {isPopular && !isSelected && !isBestValue && (
                <div className="absolute -top-3 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    MOST POPULAR
                </div>
            )}
            {/* Selected Check */}
            {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Room Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoomTypeBadge()}`}>
                            {type}
                        </span>
                        {!isAvailable && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                {isBlockedForDates ? 'Unavailable Dates' : 'Sold Out'}
                            </span>
                        )}
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{name}</h4>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                            <Users size={16} />
                            Max {maxOccupancy} {maxOccupancy === 1 ? 'Guest' : 'Guests'}
                        </span>
                        {isAvailable && (
                            <span className="text-green-600 font-medium">
                                {available} {available === 1 ? 'room' : 'rooms'} left
                            </span>
                        )}
                    </div>
                    {extraGuestPrice > 0 && (
                        <p className="text-xs text-gray-500 mb-3">
                            Price includes up to {baseGuests || maxOccupancy} guest{(baseGuests || maxOccupancy) > 1 ? 's' : ''}. Extra guest: ₹{extraGuestPrice}/night
                        </p>
                    )}

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2">
                        {amenities.slice(0, 5).map((amenity) => {
                            const config = amenityIcons[amenity];
                            if (!config) return null;
                            const IconComponent = config.icon;
                            return (
                                <span
                                    key={amenity}
                                    className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                                >
                                    <IconComponent size={12} />
                                    {config.label}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Price Section */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-right">
                        {hasOverride && (
                            <p className="text-xs text-gray-400 line-through">₹{price}</p>
                        )}
                        <p className={`text-2xl font-bold ${hasOverride ? 'text-orange-600' : 'text-gray-900'}`}>₹{displayPrice}</p>
                        <p className="text-xs text-gray-500">{hasOverride ? 'today\'s rate' : 'per night'}</p>
                    </div>
                    {isAvailable && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect && onSelect(room);
                            }}
                            className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isSelected
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-primary-100 text-primary-700 hover:bg-primary-500 hover:text-white'
                                }
              `}
                        >
                            {isSelected ? 'Selected' : 'Select Room'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RoomCard;
