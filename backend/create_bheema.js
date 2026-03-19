const bhimaLodge = {
    name: "Bheema Grand Residency",
    slug: "bheema-grand-residency",
    images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", // Luxury Hotel
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800", // Room
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"  // Reception
    ],
    distance: "200m",
    distanceType: "walkable",
    rating: 4.8,
    reviewCount: 450,
    priceStarting: 2500,
    availability: "available",
    amenities: ["wifi", "parking", "hotWater", "restaurant", "lift", "ac", "powerBackup"],
    address: "Near Main Temple Gopuram, Mantralayam",
    phone: "+91 9988776655",
    whatsapp: "+91 9988776655",
    description: "Experience luxury and comfort right next to the temple. Bheema Grand Residency offers premium rooms with modern amenities for a divine stay.",
    rooms: [
        {
            type: "AC",
            name: "Premium AC Room",
            price: 2500,
            maxOccupancy: 2,
            available: 5,
            amenities: ["ac", "hotWater", "wifi", "tv", "minibar", "kettle"]
        },
        {
            type: "Family",
            name: "Grand Family Suite",
            price: 4500,
            maxOccupancy: 4,
            available: 2,
            amenities: ["ac", "hotWater", "wifi", "tv", "livingArea", "bathtub"]
        }
    ]
};

async function createLodge() {
    try {
        const response = await fetch('http://localhost:5000/api/lodges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bhimaLodge)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Lodge Created Successfully:', data.name);
        } else {
            console.log('Error creating lodge:', data);
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

createLodge();
