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
        'distance' => '0 km',
        'darshan_timings' => "Morning: 6:00 AM - 2:00 PM\nEvening: 4:00 PM - 9:00 PM",
        'special_darshan_timings' => "Rathotsavam: 7:00 PM onwards\nHasthodaka: 12:30 PM",
        'nearby_railway_station' => 'Mantralayam Road (MALM) - 16 km away',
        'bus_timings' => 'Regular buses from Kurnool, Raichur, and Adoni.',
        'description' => 'The main Brindavana of the 17th-century Vaishnava saint Sri Raghavendra Swamy. It is located on the banks of the Tungabhadra River and is a major pilgrimage center.',
        'additional_info' => 'Free meals (Annadana) provided to devotees between 1:00 PM and 3:00 PM.',
        'images' => [
            'https://images.unsplash.com/photo-1623945359620-63959950d24c?w=800',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800'
        ]
    ],
    [
        'name' => 'Manchalamma Temple',
        'location' => 'Adjacent to the Mutt, Mantralayam',
        'google_maps_link' => 'https://maps.app.goo.gl/ManchalammaTemple',
        'distance' => '0.1 km',
        'darshan_timings' => "Morning: 6:00 AM - 1:30 PM\nEvening: 4:30 PM - 8:30 PM",
        'special_darshan_timings' => "Navarathri Special Puja",
        'nearby_railway_station' => 'Mantralayam Road (MALM) - 16 km away',
        'bus_timings' => 'Walking distance from the Mutt.',
        'description' => 'Dedicated to Goddess Manchalamma, she is considered the presiding deity of Mantralayam. Devotees traditionally visit this temple before entering the Raghavendra Swamy Mutt.',
        'additional_info' => 'The temple is situated right at the entrance of the Mutt complex.',
        'images' => [
            'https://images.unsplash.com/photo-1519810755548-39cd217da494?w=800'
        ]
    ],
    [
        'name' => 'Panchamukhi Anjaneya Temple',
        'location' => 'Gandhal, Karnataka (Across the river)',
        'google_maps_link' => 'https://maps.app.goo.gl/PanchamukhiTemple',
        'distance' => '22 km',
        'darshan_timings' => "Morning: 7:00 AM - 1:00 PM\nEvening: 3:00 PM - 7:30 PM",
        'special_darshan_timings' => "Hanuman Jayanthi Celebration",
        'nearby_railway_station' => 'Raichur Railway Station - 25 km away',
        'bus_timings' => 'Share autos and private jeeps available from Mantralayam main circle.',
        'description' => 'The spot where Sri Raghavendra Swamy performed penance for 12 years. Lord Hanuman appeared here in a five-faced form (Panchamukhi).',
        'additional_info' => 'Located on a small hillock with beautiful surrounding views.',
        'images' => [
            'https://images.unsplash.com/photo-1606293459207-681b953d394d?w=800'
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
