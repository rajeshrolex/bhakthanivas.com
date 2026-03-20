<?php
/**
 * debug-temples.php – Standalone Database Diagnostic Script
 * Visit this in your browser: https://.../php-backend/debug-temples.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

header('Content-Type: text/plain; charset=utf-8');

echo "🔍 BhaktaNivas – Database Diagnostics (Temples)\n";
echo "================================================\n\n";

try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();

    // 1. Check if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'temples'")->fetch();
    if (!$tableExists) {
        die("❌ Table 'temples' MISSING! Please run: php migrate.php or visit /php-backend/migrate.php (if triggerable)\n");
    }
    echo "✅ Table 'temples' exists.\n";

    // 2. Check columns
    $columns = $pdo->query("SHOW COLUMNS FROM temples")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    $required = [
        'id', 'name', 'location', 'google_maps_link', 'distance', 
        'darshan_timings', 'special_darshan_timings', 
        'nearby_railway_station_title', 'nearby_railway_station',
        'bus_timings_title', 'bus_timings', 
        'description', 'additional_info', 'images'
    ];

    $missing = [];
    foreach ($required as $r) {
        if (!in_array($r, $columnNames, true)) {
            $missing[] = $r;
        }
    }

    if (!empty($missing)) {
        echo "❌ MISSING COLUMNS: " . implode(', ', $missing) . "\n";
        echo "   Suggestion: Run 'php migrate.php' to add missing columns.\n";
    } else {
        echo "✅ All required columns present.\n";
    }

    // 3. Check data types for JSON columns
    foreach ($columns as $col) {
        if (in_array($col['Field'], ['images', 'amenities'], true)) {
            echo "   • Column '{$col['Field']}' type: {$col['Type']}\n";
        }
    }

    // 4. Try a test SELECT
    $count = $pdo->query("SELECT COUNT(*) FROM temples")->fetchColumn();
    echo "📊 Total temples in DB: {$count}\n";

    echo "\n🚀 Diagnostics Complete.\n";

} catch (Exception $e) {
    echo "❌ FATAL ERROR: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
