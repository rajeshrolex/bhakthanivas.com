<?php
require_once __DIR__ . '/database.php';
$db = Database::getInstance();
$pdo = $db->getPdo();

$tables = ['daily_prices', 'blocked_dates', 'lodges'];

foreach ($tables as $table) {
    echo "--- Table: $table ---\n";
    try {
        $cols = $pdo->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            echo "{$col['Field']} - {$col['Type']}\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
