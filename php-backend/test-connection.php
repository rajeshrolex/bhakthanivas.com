<?php
/**
 * test-connection.php
 * Direct database connection test, bypassing index.php
 */
require_once __DIR__ . '/config.php';

echo "<h1>Database Connection Test</h1>";
echo "<pre>";

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    echo "Connecting to: " . DB_HOST . " / " . DB_NAME . " (User: " . DB_USER . ")\n";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    echo "✅ SUCCESS: Database connected successfully!\n";

    // Test a simple query
    echo "\nTesting query: SHOW TABLES\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "⚠️ WARNING: No tables found in database '" . DB_NAME . "'. Did you run migrate.php?\n";
    } else {
        echo "✅ Tables found:\n";
        foreach ($tables as $table) {
            echo "   - $table\n";
        }
    }

} catch (PDOException $e) {
    echo "❌ ERROR: Connection failed!\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "Message: " . $e->getMessage() . "\n";
}

echo "</pre>";
