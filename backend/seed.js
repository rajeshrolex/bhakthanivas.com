const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { Lodge, Room, Booking, User } = require('./models');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding');
        await seed();
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Lodges data (same as before)
const lodgesData = [
    {
        name: "Shri Hari Retreat",
        slug: "shri-hari-retreat",
        images: [
            "https://images.unsplash.com/photo-1542314831-c6a4d14ca294?w=800",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
        ],
        distance: "200m",
        distanceType: "walkable",
        rating: 4.8,
        reviewCount: 342,
        priceStarting: 1200,
        availability: "available",
        amenities: ["wifi", "parking", "ac", "restaurant", "hotWater"],
        address: "Near Main Gate, Mantralayam",
        phone: "+91 9123456780",
        whatsapp: "+91 9123456780",
        description: "A serene and modern retreat just steps away from the Sri Raghavendra Swamy Mutt. We offer peaceful AC and Non-AC rooms with all premium amenities to make your pilgrimage comfortable.",
        rooms: [
            { type: "Non-AC", name: "Standard Room", price: 1200, maxOccupancy: 2, available: 5, totalRooms: 5, amenities: ["hotWater", "wifi"] },
            { type: "AC", name: "Premium AC Suite", price: 2100, maxOccupancy: 3, available: 3, totalRooms: 3, amenities: ["ac", "hotWater", "wifi", "tv", "balcony"] }
        ]
    },
    {
        name: "Pavithra Residency",
        slug: "pavithra-residency",
        images: [
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
            "https://images.unsplash.com/photo-1537240923712-ae0e7cf73ea3?w=800",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"
        ],
        distance: "600m",
        distanceType: "walkable",
        rating: 4.5,
        reviewCount: 189,
        priceStarting: 800,
        availability: "available",
        amenities: ["parking", "hotWater", "powerBackup"],
        address: "Market Road, Mantralayam",
        phone: "+91 9876543200",
        whatsapp: "+91 9876543200",
        description: "Comfortable middle-tier residency catering to families and groups. Focuses on cleanliness and quick room service.",
        rooms: [
            { type: "Non-AC", name: "Standard Room", price: 1500, maxOccupancy: 2, available: 8, totalRooms: 8, amenities: ["hotWater"] },
            { type: "AC", name: "Family AC Room", price: 1500, maxOccupancy: 4, available: 4, totalRooms: 4, amenities: ["ac", "hotWater", "tv"] }
        ]
    },
    {
        name: "Mantralayam Grand Lodge",
        slug: "mantralayam-grand-lodge",
        images: [
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800"
        ],
        distance: "1.5km",
        distanceType: "auto",
        rating: 4.1,
        reviewCount: 76,
        priceStarting: 600,
        availability: "available",
        amenities: ["wifi", "parking", "hotWater", "lift", "powerBackup"],
        address: "Ring Road bypass, Mantralayam",
        phone: "+91 9988776655",
        whatsapp: "+91 9988776655",
        description: "A large lodge located slightly outside the busy center. Quiet environment with spacious parking facilities.",
        rooms: [
            { type: "Non-AC", name: "Budget Double", price: 600, maxOccupancy: 2, available: 10, totalRooms: 10, amenities: ["hotWater", "wifi"] },
            { type: "AC", name: "Standard AC", price: 1100, maxOccupancy: 2, available: 6, totalRooms: 6, amenities: ["ac", "hotWater", "wifi", "tv"] },
            { type: "AC", name: "Grand Family Group", price: 2500, maxOccupancy: 6, available: 2, totalRooms: 2, amenities: ["ac", "hotWater", "wifi", "tv", "extraBed"] }
        ]
    },
    {
        name: "Yatri Nivas by Swamy",
        slug: "yatri-nivas-by-swamy",
        images: [
            "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
        ],
        distance: "1.0km",
        distanceType: "auto",
        rating: 4.0,
        reviewCount: 110,
        priceStarting: 500,
        availability: "limited",
        amenities: ["parking", "hotWater"],
        address: "Temple bypass, Mantralayam",
        phone: "+91 9123459990",
        whatsapp: "+91 9123459990",
        description: "Basic accommodation built specifically for pilgrims. Safe, clean, and extremely affordable.",
        rooms: [
            { type: "Non-AC", name: "Basic Room", price: 500, maxOccupancy: 2, available: 3, totalRooms: 3, amenities: ["hotWater"] },
            { type: "Non-AC", name: "4-Bed Setup", price: 800, maxOccupancy: 4, available: 1, totalRooms: 1, amenities: ["hotWater"] }
        ]
    }
];

async function seed() {
    try {
        console.log('Clearing existing data...');
        await Promise.all([
            Lodge.deleteMany({}),
            Room.deleteMany({}),
            Booking.deleteMany({}),
            User.deleteMany({})
        ]);
        console.log('Data cleared.');

        // Seed lodges and rooms
        console.log('Seeding lodges and rooms...');
        const seededLodges = [];

        for (const lodgeData of lodgesData) {
            const { rooms, ...lodgeFields } = lodgeData;

            // Create lodge
            const lodge = await Lodge.create(lodgeFields);
            seededLodges.push(lodge);

            // Create rooms for this lodge
            if (rooms && rooms.length > 0) {
                const roomsWithLodgeId = rooms.map(room => ({
                    ...room,
                    lodgeId: lodge._id
                }));
                await Room.insertMany(roomsWithLodgeId);
            }
        }
        console.log('Lodges seeded successfully');

        // Create users with proper lodge references
        console.log('Seeding users...');
        const users = [
            {
                name: "Super Admin",
                email: "super@admin.com",
                password: "password",
                role: "super_admin",
                lodgeId: null
            },
            {
                name: "Bhakti Manager",
                email: "bhakti@admin.com",
                password: "password",
                role: "admin",
                lodgeId: seededLodges[0]._id
            },
            {
                name: "Guru Krupa Manager",
                email: "gurukrupa@admin.com",
                password: "password",
                role: "admin",
                lodgeId: seededLodges[1]._id
            },
            {
                name: "Divine Stay Manager",
                email: "divine@admin.com",
                password: "password",
                role: "admin",
                lodgeId: seededLodges[2]._id
            },
            {
                name: "Venkateswara Manager",
                email: "venkateswara@admin.com",
                password: "password",
                role: "admin",
                lodgeId: seededLodges[3]._id
            }
        ];

        await User.insertMany(users);
        console.log('Users seeded successfully');

        // Create sample bookings
        console.log('Seeding bookings...');
        const sampleBookings = [];
        for (let i = 0; i < 10; i++) {
            const lodge = seededLodges[i % seededLodges.length];
            const rooms = await Room.find({ lodgeId: lodge._id });
            const room = rooms[0];

            sampleBookings.push({
                bookingId: `MLY${20240001 + i}`,
                lodgeId: lodge._id,
                lodgeName: lodge.name,
                roomType: room.type,
                roomName: room.name,
                roomPrice: room.price,
                checkIn: new Date(Date.now() + i * 86400000),
                checkOut: new Date(Date.now() + (i + 2) * 86400000),
                guests: 2,
                rooms: 1,
                customerName: `Guest ${i + 1}`,
                customerMobile: `+91 98765432${10 + i}`,
                customerEmail: `guest${i + 1}@example.com`,
                idType: 'aadhar',
                idNumber: `1234 5678 90${10 + i}`,
                paymentMethod: 'payAtLodge',
                totalAmount: room.price * 2,
                status: i % 3 === 0 ? 'confirmed' : i % 3 === 1 ? 'pending' : 'checked-in'
            });
        }
        await Booking.insertMany(sampleBookings);
        console.log('Bookings seeded successfully');

        console.log('\n✅ All data seeded successfully!');
        console.log('\n--- Login Credentials ---');
        console.log('Super Admin: super@admin.com / password');
        console.log('Lodge Admins: bhakti@admin.com, gurukrupa@admin.com, divine@admin.com, venkateswara@admin.com / password');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

connectDB();

