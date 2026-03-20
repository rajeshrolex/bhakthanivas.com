<?php
/**
 * fix-temples.php – Emergency Database Fix Script
 * Visit this in your browser: https://.../php-backend/fix-temples.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

header('Content-Type: text/plain; charset=utf-8');

echo "🛠️ BhaktaNivas – Emergency Database Fix (Temples)\n";
echo "===============================================\n\n";

try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();

    echo "📡 Connected to database: " . DB_NAME . "\n";

    $sql = "
        CREATE TABLE IF NOT EXISTS temples (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255) NOT NULL,
            location   VARCHAR(255),
            google_maps_link TEXT,
            distance   VARCHAR(255),
            darshan_timings TEXT,
            special_darshan_timings TEXT,
            nearby_railway_station_title VARCHAR(255) DEFAULT 'Nearby Railway Station',
            nearby_railway_station TEXT,
            bus_timings_title VARCHAR(255) DEFAULT 'Bus Timings',
            bus_timings TEXT,
            description TEXT,
            additional_info TEXT,
            images LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";

    $pdo->exec($sql);
    echo "✅ Table 'temples' created or already exists.\n";

    // Fix for shared hosting JSON issues
    $pdo->exec("ALTER TABLE temples MODIFY COLUMN images LONGTEXT");
    echo "✅ Applied LONGTEXT fix for images column.\n";

    echo "\n🎉 Database fix complete! You can now use the Temple Details page.\n";
    echo "👉 Please delete this file (fix-temples.php) from your server for security.\n";

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
