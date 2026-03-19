// Mock data for Bhakta Nivas
// This will be replaced with actual API data in production

// Spiritual Greetings - Used on website header/footer
export const spiritualGreetings = {
    primary: "|| Sriman Moola Ramo Vijayate ||",
    secondary: "|| Sri Gururajo Vijayate ||"
};

// Booking Policies - Displayed during booking
export const bookingPolicies = [
    "Booking can be done for one to two days.",
    "No cancellation, refund, or date/time change allowed.",
    "Each room can accommodate two to four adults.",
    "No extra bed or bedding will be provided.",
    "You may book rooms instantly and also in advance.",
    "A successful payment does not guarantee a booking. Wait for confirmation.",
    "A refundable deposit equal to one day's room tariff must be paid in cash at check-in.",
    "The lodge reserves the right to cancel any booking and refund the amount in full."
];

// Contact for enquiries
export const mainContact = "+91 9603527758";

export const lodges = [
    {
        id: 1,
        name: "Bheema Grand Residency",
        slug: "bheema-grand-residency",
        tagline: "Rooted in history, built for comfort.",
        images: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"
        ],
        distance: "200m",
        distanceType: "walkable",
        rating: 4.8,
        reviewCount: 312,
        priceStarting: 1000,
        availability: "available",
        featured: true,
        amenities: ["wifi", "parking", "hotWater", "powerBackup", "ac", "lift"],
        address: "Near Sri Raghavendra Swamy Mutt, Mantralayam, Andhra Pradesh",
        phone: "+91 9603527758",
        whatsapp: "+91 9603527758",
        description: "Bheema Grand Residency offers premium accommodation just 200 meters from Sri Raghavendra Swamy Mutt. Rooted in history, built for comfort - experience the perfect blend of spirituality and modern amenities for your divine journey.",
        rooms: [
            {
                id: 101,
                type: "Non-AC",
                name: "Standard Non-AC Room",
                price: 1000,
                maxOccupancy: 4,
                available: 5,
                amenities: ["hotWater", "wifi", "tv"]
            },
            {
                id: 102,
                type: "AC",
                name: "Deluxe AC Room",
                price: 1500,
                maxOccupancy: 4,
                available: 3,
                amenities: ["ac", "hotWater", "wifi", "tv"]
            },
            {
                id: 103,
                type: "Family",
                name: "Premium Family Suite",
                price: 2000,
                maxOccupancy: 4,
                available: 2,
                amenities: ["ac", "hotWater", "wifi", "tv", "minibar"]
            }
        ]
    },
    {
        id: 2,
        name: "Raghavendra Inn",
        slug: "raghavendra-inn",
        images: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"
        ],
        distance: "150m",
        distanceType: "walkable",
        rating: 4.7,
        reviewCount: 256,
        priceStarting: 600,
        availability: "available",
        amenities: ["wifi", "parking", "hotWater", "lift", "powerBackup"],
        address: "Temple Road, Mantralayam",
        phone: "+91 9876543211",
        whatsapp: "+91 9876543211",
        description: "One of the closest private lodges to the temple, offering excellent hospitality and modern amenities for a comfortable pilgrimage.",
        rooms: [
            {
                id: 201,
                type: "Non-AC",
                name: "Economy Room",
                price: 600,
                maxOccupancy: 2,
                available: 8,
                amenities: ["hotWater", "wifi"]
            },
            {
                id: 202,
                type: "AC",
                name: "Premium AC Room",
                price: 1000,
                maxOccupancy: 2,
                available: 4,
                amenities: ["ac", "hotWater", "wifi", "tv"]
            },
            {
                id: 203,
                type: "Dormitory",
                name: "Dormitory (Per Bed)",
                price: 250,
                maxOccupancy: 1,
                available: 15,
                amenities: ["hotWater", "locker"]
            }
        ]
    },
    {
        id: 3,
        name: "Bhakti Nivas",
        slug: "bhakti-nivas",
        images: [
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800"
        ],
        distance: "500m",
        distanceType: "walkable",
        rating: 4.3,
        reviewCount: 89,
        priceStarting: 500,
        availability: "limited",
        amenities: ["wifi", "parking", "hotWater", "restaurant"],
        address: "Main Road, Mantralayam",
        phone: "+91 9876543212",
        whatsapp: "+91 9876543212",
        description: "Budget-friendly accommodation with all essential amenities. In-house restaurant serving pure vegetarian food.",
        rooms: [
            {
                id: 301,
                type: "Non-AC",
                name: "Basic Room",
                price: 500,
                maxOccupancy: 2,
                available: 2,
                amenities: ["hotWater"]
            },
            {
                id: 302,
                type: "AC",
                name: "AC Room",
                price: 900,
                maxOccupancy: 2,
                available: 1,
                amenities: ["ac", "hotWater", "wifi", "tv"]
            }
        ]
    },
    {
        id: 4,
        name: "Guru Krupa Lodge",
        slug: "guru-krupa-lodge",
        images: [
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
            "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800",
            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800"
        ],
        distance: "800m",
        distanceType: "walkable",
        rating: 4.2,
        reviewCount: 67,
        priceStarting: 450,
        availability: "available",
        amenities: ["parking", "hotWater", "powerBackup"],
        address: "Station Road, Mantralayam",
        phone: "+91 9876543213",
        whatsapp: "+91 9876543213",
        description: "Affordable accommodation suitable for budget travelers. Clean rooms with basic amenities.",
        rooms: [
            {
                id: 401,
                type: "Non-AC",
                name: "Standard Room",
                price: 450,
                maxOccupancy: 2,
                available: 10,
                amenities: ["hotWater"]
            },
            {
                id: 402,
                type: "Non-AC",
                name: "Triple Sharing",
                price: 650,
                maxOccupancy: 3,
                available: 5,
                amenities: ["hotWater"]
            }
        ]
    },
    {
        id: 5,
        name: "Divine Stay Suites",
        slug: "divine-stay-suites",
        images: [
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
        ],
        distance: "1.2km",
        distanceType: "auto",
        rating: 4.6,
        reviewCount: 145,
        priceStarting: 1000,
        availability: "available",
        amenities: ["wifi", "parking", "hotWater", "lift", "ac", "powerBackup", "restaurant"],
        address: "Highway Road, Mantralayam",
        phone: "+91 9876543214",
        whatsapp: "+91 9876543214",
        description: "Premium accommodation with modern facilities. Ideal for families seeking comfort and luxury during their pilgrimage.",
        rooms: [
            {
                id: 501,
                type: "AC",
                name: "Superior AC Room",
                price: 1000,
                maxOccupancy: 2,
                available: 6,
                amenities: ["ac", "hotWater", "wifi", "tv", "minibar"]
            },
            {
                id: 502,
                type: "Family",
                name: "Deluxe Family Suite",
                price: 2000,
                maxOccupancy: 5,
                available: 3,
                amenities: ["ac", "hotWater", "wifi", "tv", "minibar", "extraBed", "balcony"]
            },
            {
                id: 503,
                type: "AC",
                name: "Executive Room",
                price: 1500,
                maxOccupancy: 2,
                available: 4,
                amenities: ["ac", "hotWater", "wifi", "tv", "minibar", "workDesk"]
            }
        ]
    },
    {
        id: 6,
        name: "Sree Venkateswara Lodge",
        slug: "sree-venkateswara-lodge",
        images: [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
        ],
        distance: "1.5km",
        distanceType: "auto",
        rating: 4.0,
        reviewCount: 52,
        priceStarting: 550,
        availability: "full",
        amenities: ["parking", "hotWater", "wifi"],
        address: "Bus Stand Road, Mantralayam",
        phone: "+91 9876543215",
        whatsapp: "+91 9876543215",
        description: "Well-maintained lodge with easy access to bus stand. Good for travelers arriving late or leaving early.",
        rooms: [
            {
                id: 601,
                type: "Non-AC",
                name: "Standard Room",
                price: 550,
                maxOccupancy: 2,
                available: 0,
                amenities: ["hotWater", "wifi"]
            },
            {
                id: 602,
                type: "AC",
                name: "AC Room",
                price: 950,
                maxOccupancy: 2,
                available: 0,
                amenities: ["ac", "hotWater", "wifi", "tv"]
            }
        ]
    }
];

export const amenityIcons = {
    wifi: { name: "Wifi", icon: "Wifi" },
    parking: { name: "Parking", icon: "Car" },
    hotWater: { name: "Hot Water", icon: "Droplets" },
    lift: { name: "Lift/Elevator", icon: "ArrowUpDown" },
    powerBackup: { name: "Power Backup", icon: "Zap" },
    ac: { name: "Air Conditioning", icon: "Wind" },
    restaurant: { name: "Restaurant", icon: "UtensilsCrossed" },
    tv: { name: "Television", icon: "Tv" },
    minibar: { name: "Mini Bar", icon: "GlassWater" },
    extraBed: { name: "Extra Bed", icon: "Bed" },
    locker: { name: "Locker", icon: "Lock" },
    balcony: { name: "Balcony", icon: "DoorOpen" },
    workDesk: { name: "Work Desk", icon: "Monitor" }
};

export const sortOptions = [
    { value: "popularity", label: "Popularity" },
    { value: "rating", label: "Guest Ratings" },
    { value: "priceLow", label: "Price: Low to High" },
    { value: "priceHigh", label: "Price: High to Low" },
    { value: "distance", label: "Distance from Mutt" }
];

export const roomTypes = [
    { value: "all", label: "All Room Types" },
    { value: "Non-AC", label: "Non-AC Rooms" },
    { value: "AC", label: "AC Rooms" },
    { value: "Family", label: "Family Rooms" },
    { value: "Dormitory", label: "Dormitory" }
];

export const idTypes = [
    { value: "aadhar", label: "Aadhar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "driving", label: "Driving License" },
    { value: "passport", label: "Passport" },
    { value: "voter", label: "Voter ID" }
];

// Helper functions
export const getLodgeById = (id) => lodges.find(lodge => lodge.id === parseInt(id));
export const getLodgeBySlug = (slug) => lodges.find(lodge => lodge.slug === slug);

export const getAvailableLodges = () => lodges.filter(lodge => lodge.availability !== "full");

export const filterLodges = (filters) => {
    let filtered = [...lodges];

    if (filters.distanceType) {
        filtered = filtered.filter(lodge => lodge.distanceType === filters.distanceType);
    }

    if (filters.priceMax) {
        filtered = filtered.filter(lodge => lodge.priceStarting <= filters.priceMax);
    }

    if (filters.availability && filters.availability !== "all") {
        filtered = filtered.filter(lodge => lodge.availability === filters.availability);
    }

    return filtered;
};

export const sortLodges = (lodgeList, sortBy) => {
    const sorted = [...lodgeList];

    switch (sortBy) {
        case "priceLow":
            return sorted.sort((a, b) => a.priceStarting - b.priceStarting);
        case "priceHigh":
            return sorted.sort((a, b) => b.priceStarting - a.priceStarting);
        case "rating":
            return sorted.sort((a, b) => b.rating - a.rating);
        case "distance":
            return sorted.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
        default:
            return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    }
};
export const users = [
    {
        id: 1,
        name: "Super Admin",
        email: "super@admin.com",
        password: "password", // In a real app, this would be hashed
        role: "super_admin",
        lodgeId: null
    },
    {
        id: 2,
        name: "Bheema Manager",
        email: "bheema@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 1
    },
    {
        id: 3,
        name: "Raghavendra Manager",
        email: "raghavendra@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 2
    },
    {
        id: 4,
        name: "Bhakti Manager",
        email: "bhakti@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 3
    },
    {
        id: 5,
        name: "Guru Krupa Manager",
        email: "gurukrupa@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 4
    },
    {
        id: 6,
        name: "Divine Stay Manager",
        email: "divine@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 5
    },
    {
        id: 7,
        name: "Venkateswara Manager",
        email: "venkateswara@admin.com",
        password: "password",
        role: "admin",
        lodgeId: 6
    }
];
