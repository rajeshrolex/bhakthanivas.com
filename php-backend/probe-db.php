<?php
// probe-db.php
require_once 'config.php';
// We don't require database.php yet because we want to try different credentials

$possibilities = [
    [
        'host' => DB_HOST,
        'user' => DB_USER,
        'pass' => DB_PASS,
        'name' => DB_NAME
    ],
    [
        'host' => 'localhost',
        'user' => 'root',
        'pass' => '',
        'name' => 'bhakthanivas'
    ],
    [
        'host' => 'localhost',
        'user' => 'root',
        'pass' => '',
        'name' => 'u882069120_bhakthanivas'
    ]
];

foreach ($possibilities as $p) {
    echo "Trying: {$p['user']}@{$p['host']}/{$p['name']} ... ";
    try {
        $dsn = "mysql:host={$p['host']};dbname={$p['name']};charset=utf8mb4";
        $pdo = new PDO($dsn, $p['user'], $p['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo "✅ SUCCESS!\n";
        
        // Run migration
        $result = $pdo->query("SHOW COLUMNS FROM lodges LIKE 'google_maps_link'");
        if ($result->rowCount() === 0) {
            $pdo->exec("ALTER TABLE lodges ADD COLUMN google_maps_link TEXT AFTER distance_type");
            echo "  ✅ Added 'google_maps_link' column to 'lodges' table.\n";
        } else {
            echo "  ℹ️ 'google_maps_link' column already exists.\n";
        }
        exit(0);
    } catch (Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
    }
}

echo "None of the probed credentials worked.\n";
exit(1);
