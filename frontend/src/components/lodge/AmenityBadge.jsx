import React from 'react';
import {
    Wifi,
    Car,
    Droplets,
    ArrowUpDown,
    Zap,
    Wind,
    UtensilsCrossed,
    Tv,
    GlassWater,
    Bed,
    Lock,
    DoorOpen,
    Monitor
} from 'lucide-react';

const iconMap = {
    wifi: Wifi,
    parking: Car,
    hotWater: Droplets,
    lift: ArrowUpDown,
    powerBackup: Zap,
    ac: Wind,
    restaurant: UtensilsCrossed,
    tv: Tv,
    minibar: GlassWater,
    extraBed: Bed,
    locker: Lock,
    balcony: DoorOpen,
    workDesk: Monitor
};

const labelMap = {
    wifi: 'Free WiFi',
    parking: 'Free Parking',
    hotWater: 'Hot Water',
    lift: 'Lift/Elevator',
    powerBackup: 'Power Backup',
    ac: 'Air Conditioning',
    restaurant: 'Restaurant',
    tv: 'Television',
    minibar: 'Mini Bar',
    extraBed: 'Extra Bed Available',
    locker: 'Locker',
    balcony: 'Balcony',
    workDesk: 'Work Desk'
};

const AmenityBadge = ({ amenity, variant = 'default', showLabel = true }) => {
    const IconComponent = iconMap[amenity];
    const label = labelMap[amenity];

    if (!IconComponent || !label) return null;

    const variants = {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-primary-100 text-primary-700',
        outline: 'border border-gray-300 text-gray-600',
        minimal: 'text-gray-600'
    };

    if (variant === 'minimal') {
        return (
            <div className="flex items-center gap-2 text-gray-600">
                <IconComponent size={18} className="text-primary-500" />
                {showLabel && <span className="text-sm">{label}</span>}
            </div>
        );
    }

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
      ${variants[variant]}
    `}>
            <IconComponent size={14} />
            {showLabel && label}
        </span>
    );
};

// Grid component for displaying multiple amenities
export const AmenityGrid = ({ amenities, variant = 'default', columns = 2 }) => {
    const safeAmenities = Array.isArray(amenities) ? amenities : [];
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-3`}>
            {safeAmenities.map((amenity) => (
                <AmenityBadge
                    key={amenity}
                    amenity={amenity}
                    variant={variant}
                />
            ))}
        </div>
    );
};

// List component for displaying amenities in a list
export const AmenityList = ({ amenities }) => {
    const safeAmenities = Array.isArray(amenities) ? amenities : [];
    return (
        <div className="space-y-3">
            {safeAmenities.map((amenity) => (
                <AmenityBadge
                    key={amenity}
                    amenity={amenity}
                    variant="minimal"
                />
            ))}
        </div>
    );
};

export default AmenityBadge;
