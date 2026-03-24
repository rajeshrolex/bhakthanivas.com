<?php
// web-migrate.php
require_once 'config.php';
require_once 'database.php';

$db = Database::getInstance();
$pdo = $db->getPdo();

echo "<pre>";
echo "Running web-based migration...\n";

try {
    // Check if column exists
    $result = $pdo->query("SHOW COLUMNS FROM lodges LIKE 'google_maps_link'");
    if ($result->rowCount() === 0) {
        $pdo->exec("ALTER TABLE lodges ADD COLUMN google_maps_link TEXT AFTER distance_type");
        echo "✅ Added 'google_maps_link' column to 'lodges' table.\n";
    } else {
        echo "ℹ️ 'google_maps_link' column already exists.\n";
    }
    echo "\nMigration complete!";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
echo "</pre>";
