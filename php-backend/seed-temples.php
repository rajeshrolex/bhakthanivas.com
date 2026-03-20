<?php
/**
 * seed-temples.php – Database Seed Script for Temples
 *
 * Populates the temples table with sample data.
 * Run after migrate.php: php seed-temples.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

$db  = Database::getInstance();

echo "🌱 BhaktaNivas – Seeding Temples...\n\n";

$temples = [
    [
        'name' => 'Sri Raghavendra Swamy Mutt',
        'location' => 'Mantralayam, Andhra Pradesh',
        'google_maps_link' => 'https://maps.app.goo.gl/MantralayamTemple',
        'distance' => '16 km',
        'darshan_timings' => "Morning: 6:00 AM - 1:00 PM\nEvening: 4:00 PM - 8:00 PM",
        'special_darshan_timings' => "VIP Darshan: 7:00 AM - 9:00 AM",
        'nearby_railway_station' => 'Mantralayam Road (MAYE) - 15 km',
        'bus_timings' => 'APSRTC buses from Kurnool, Hyderabad',
        'description' => 'The main Brindavana of the 17th-century Vaishnava saint Sri Raghavendra Swamy. It is located on the banks of the Tungabhadra River and is a major pilgrimage center.',
        'additional_info' => 'Free meals (Annadana) provided to devotees between 1:00 PM and 3:00 PM.',
        'images' => [
            'https://images.unsplash.com/photo-1623945359620-63959950d24c?w=800',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800'
        ]
    ],
    [
        'name' => 'Sample Temple (Dummy)',
        'location' => 'Generic Location, State',
        'google_maps_link' => 'https://maps.google.com/...',
        'distance' => 'e.g. 5 km',
        'darshan_timings' => "Morning: 6:00 AM - 12:00 PM\nEvening: 5:00 PM - 9:00 PM",
        'special_darshan_timings' => "e.g. VIP Darshan: 7:00 AM - 9:00 AM",
        'nearby_railway_station' => 'e.g. Nearby Road (NR) - 10 km',
        'bus_timings' => 'e.g. APSRTC buses from City Center',
        'description' => 'Detailed description about the temple...',
        'additional_info' => 'Any extra details, package costs, special notes...',
        'images' => [
            'https://images.unsplash.com/photo-1519810755548-39cd217da494?w=800'
        ]
    ]
];

foreach ($temples as $t) {
    // Check if temple already exists
    $exists = $db->fetchOne("SELECT id FROM temples WHERE name = ?", [$t['name']]);
    if ($exists) {
        echo "  ⏭️  Temple '{$t['name']}' already exists, skipping.\n";
        continue;
    }

    $db->query(
        "INSERT INTO temples (name, location, google_maps_link, distance, darshan_timings, 
                             special_darshan_timings, nearby_railway_station, bus_timings, 
                             description, additional_info, images) 
         VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
            $t['name'],
            $t['location'],
            $t['google_maps_link'],
            $t['distance'],
            $t['darshan_timings'],
            $t['special_darshan_timings'],
            $t['nearby_railway_station'],
            $t['bus_timings'],
            $t['description'],
            $t['additional_info'],
            json_encode($t['images'])
        ]
    );
    echo "  ✅  Temple '{$t['name']}' created.\n";
}

echo "\n🎉 Seeding complete!\n";
