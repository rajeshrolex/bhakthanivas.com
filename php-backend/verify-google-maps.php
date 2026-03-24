<?php
// verify-google-maps.php
require_once 'config.php';
require_once 'database.php';

echo "<pre>";
echo "Verifying 'google_maps_link' column...\n";

try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();
    
    $stmt = $pdo->query("SHOW COLUMNS FROM lodges LIKE 'google_maps_link'");
    $column = $stmt->fetch();
    
    if ($column) {
        echo "✅ SUCCESS: 'google_maps_link' column exists.\n";
        print_r($column);
    } else {
        echo "❌ FAILED: 'google_maps_link' column does NOT exist.\n";
        
        echo "Attempting auto-fix...\n";
        $pdo->exec("ALTER TABLE lodges ADD COLUMN google_maps_link TEXT AFTER distance_type");
        echo "✅ Fixed: Column added.\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
echo "</pre>";
