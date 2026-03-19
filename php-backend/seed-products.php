<?php
/**
 * seed-products.php – Database Seed Script
 *
 * Populates the database with 3 sample lodges, rooms, and one super_admin user.
 * Run after migrate.php: php seed-products.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

$db  = Database::getInstance();

echo "🌱 BhaktaNivas – Seeding Database...\n\n";

// ================================================================ Super Admin
echo "👤 Creating super_admin user...\n";

$adminEmail = 'info@bhakthanivas.com';
$existing   = $db->fetchOne("SELECT id FROM users WHERE email = ?", [$adminEmail]);

if (!$existing) {
    $db->query(
        "INSERT INTO users (name, email, password, phone, role) VALUES (?,?,?,?,?)",
        [
            'Admin',
            $adminEmail,
            password_hash('admin@2026', PASSWORD_BCRYPT),
            '+91 9876543210',
            'super_admin',
        ]
    );
    echo "  ✅  Super admin created: {$adminEmail} / admin@2026\n";
} else {
    echo "  ⏭️  Super admin already exists, skipping.\n";
}

// ================================================================ Lodges
$lodges = [
    [
        'name'          => 'Bhaktha Nivas – Temple View',
        'slug'          => 'bhaktha-nivas-temple-view',
        'tagline'       => 'A serene stay with a divine view of the Mantralayam temple',
        'distance'      => '50',
        'distance_type' => 'walkable',
        'price_starting'=> 800,
        'availability'  => 'available',
        'featured'      => 1,
        'address'       => 'Near Sri Raghavendra Swami Mutt, Mantralayam, Andhra Pradesh 518345',
        'phone'         => '+91 94406 86505',
        'whatsapp'      => '+91 94406 86505',
        'description'   => 'Experience divine tranquility at Bhaktha Nivas Temple View, just 50 metres from the sacred Mantralayam temple. Our lodge offers comfortable accommodation with modern amenities, ensuring a peaceful stay for pilgrims and devotees.',
        'amenities'     => ['Free Wi-Fi', 'AC Available', 'Parking', 'Hot Water', 'Room Service', '24/7 Reception'],
        'images'        => [
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        ],
        'terms' => "1. Check-in: 12:00 PM, Check-out: 11:00 AM.\n2. Please carry a valid ID proof (Aadhar/Passport/DL).\n3. Standard cancellation policies apply.\n4. Pets not allowed.\n5. Smoking not allowed inside rooms.",
        'rooms' => [
            ['type' => 'Non-AC', 'name' => 'Non-AC Standard',    'price' => 800,  'base_guests' => 2, 'max_occupancy' => 3, 'total_rooms' => 5, 'amenities' => ['Fan', 'Hot Water', 'TV']],
            ['type' => 'AC',     'name' => 'AC Deluxe',          'price' => 1400, 'base_guests' => 2, 'max_occupancy' => 3, 'total_rooms' => 4, 'amenities' => ['AC', 'Hot Water', 'TV', 'Mini Fridge']],
            ['type' => 'Family', 'name' => 'Family Suite',        'price' => 2200, 'base_guests' => 4, 'max_occupancy' => 6, 'total_rooms' => 2, 'amenities' => ['AC', 'Hot Water', 'TV', 'Sofa']],
        ],
    ],
    [
        'name'          => 'Mantralayam Ananda Nilayam',
        'slug'          => 'mantralayam-ananda-nilayam',
        'tagline'       => 'Peaceful comfort for the devoted pilgrim',
        'distance'      => '200',
        'distance_type' => 'walkable',
        'price_starting'=> 600,
        'availability'  => 'available',
        'featured'      => 1,
        'address'       => 'Main Road, Mantralayam, Andhra Pradesh 518345',
        'phone'         => '+91 94406 86506',
        'whatsapp'      => '+91 94406 86506',
        'description'   => 'Ananda Nilayam offers cozy and clean accommodation at an affordable price. Ideally located on the main road to the Mantralayam temple, we provide a comfortable base for your spiritual journey.',
        'amenities'     => ['Free Wi-Fi', 'Parking', 'Hot Water', '24/7 Reception', 'Vegetarian Restaurant'],
        'images'        => [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe2fa?w=800',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        ],
        'terms' => "1. Check-in: 12:00 PM, Check-out: 11:00 AM.\n2. Please carry a valid ID proof.\n3. No refunds for early check-out.\n4. No alcohol permitted on premises.",
        'rooms' => [
            ['type' => 'Non-AC', 'name' => 'Economy Non-AC', 'price' => 600,  'base_guests' => 2, 'max_occupancy' => 2, 'total_rooms' => 8, 'amenities' => ['Fan', 'Hot Water']],
            ['type' => 'AC',     'name' => 'Standard AC',    'price' => 1100, 'base_guests' => 2, 'max_occupancy' => 3, 'total_rooms' => 6, 'amenities' => ['AC', 'Hot Water', 'TV']],
            ['type' => 'Family', 'name' => 'Family Room',    'price' => 1800, 'base_guests' => 4, 'max_occupancy' => 5, 'total_rooms' => 3, 'amenities' => ['AC', 'Hot Water', 'TV']],
        ],
    ],
    [
        'name'          => 'Sri Raghavendra Bhavan',
        'slug'          => 'sri-raghavendra-bhavan',
        'tagline'       => 'Divine hospitality in the heart of Mantralayam',
        'distance'      => '5',
        'distance_type' => 'auto',
        'price_starting'=> 1200,
        'availability'  => 'limited',
        'featured'      => 0,
        'address'       => 'Bus Stand Road, Mantralayam, Andhra Pradesh 518345',
        'phone'         => '+91 94406 86507',
        'whatsapp'      => '+91 94406 86507',
        'description'   => 'Sri Raghavendra Bhavan is a premium lodge offering luxurious rooms with all modern amenities. A perfect blend of spirituality and comfort for discerning pilgrims.',
        'amenities'     => ['Free Wi-Fi', 'AC Available', 'Parking', 'Hot Water', 'Room Service', '24/7 Reception', 'Lift', 'Conference Hall'],
        'images'        => [
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        ],
        'terms' => "1. Check-in: 01:00 PM, Check-out: 11:00 AM.\n2. Please carry a valid ID proof.\n3. Cancellation within 24 hours – no refund.\n4. Extra bed available on request.",
        'rooms' => [
            ['type' => 'AC',        'name' => 'Deluxe AC',    'price' => 1200, 'base_guests' => 2, 'max_occupancy' => 2, 'total_rooms' => 5,  'amenities' => ['AC', 'Hot Water', 'TV', 'Mini Fridge']],
            ['type' => 'Family',    'name' => 'Premium Suite', 'price' => 2800, 'base_guests' => 4, 'max_occupancy' => 6, 'total_rooms' => 2,  'amenities' => ['AC', 'Hot Water', 'TV', 'Sofa', 'Mini Bar']],
            ['type' => 'Dormitory', 'name' => 'Dormitory',    'price' => 350,  'base_guests' => 1, 'max_occupancy' => 1, 'total_rooms' => 20, 'amenities' => ['Fan', 'Shared Bathroom']],
        ],
    ],
];

echo "\n🏨 Creating lodges and rooms...\n";

foreach ($lodges as $lodgeData) {
    // Check if lodge already exists
    $exists = $db->fetchOne("SELECT id FROM lodges WHERE slug = ?", [$lodgeData['slug']]);

    if ($exists) {
        echo "  ⏭️  Lodge '{$lodgeData['name']}' already exists, skipping.\n";
        continue;
    }

    $rooms = $lodgeData['rooms'];
    unset($lodgeData['rooms']);

    $amenitiesJson = json_encode($lodgeData['amenities']);
    $imagesJson    = json_encode($lodgeData['images']);

    $db->query(
        "INSERT INTO lodges
         (name, slug, tagline, images, distance, distance_type, price_starting,
          availability, featured, amenities, address, phone, whatsapp, description, terms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $lodgeData['name'],
            $lodgeData['slug'],
            $lodgeData['tagline'],
            $imagesJson,
            $lodgeData['distance'],
            $lodgeData['distance_type'],
            $lodgeData['price_starting'],
            $lodgeData['availability'],
            $lodgeData['featured'],
            $amenitiesJson,
            $lodgeData['address'],
            $lodgeData['phone'],
            $lodgeData['whatsapp'],
            $lodgeData['description'],
            $lodgeData['terms'],
        ]
    );

    $lodgeId = (int)$db->lastInsertId();
    echo "  ✅  Lodge '{$lodgeData['name']}' created (ID: {$lodgeId})\n";

    foreach ($rooms as $room) {
        $db->query(
            "INSERT INTO rooms
             (lodge_id, type, name, price, base_guests, extra_guest_price, max_occupancy, total_rooms, available, amenities)
             VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                $lodgeId,
                $room['type'],
                $room['name'],
                $room['price'],
                $room['base_guests'],
                0,
                $room['max_occupancy'],
                $room['total_rooms'],
                $room['total_rooms'],
                json_encode($room['amenities']),
            ]
        );
        echo "       → Room '{$room['name']}' ({$room['type']}) – ₹{$room['price']}/night\n";
    }
}

echo "\n─────────────────────────────────────────────\n";
echo "🎉 Seeding complete!\n\n";
echo "   Login credentials:\n";
echo "   Email:    info@bhakthanivas.com\n";
echo "   Password: admin@2026\n\n";
echo "   Run your PHP server and visit:\n";
echo "   http://localhost/php-backend/index.php/api/health\n\n";
