<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

$db = Database::getInstance();
$lodges = $db->fetchAll("SELECT * FROM lodges");
echo "Count: " . count($lodges) . "\n";
foreach ($lodges as $l) {
    echo "ID: {$l['id']}, Name: {$l['name']}, Slug: {$l['slug']}, Price: {$l['price_starting']}\n";
}

$rooms = $db->fetchAll("SELECT * FROM rooms");
echo "Rooms Count: " . count($rooms) . "\n";
