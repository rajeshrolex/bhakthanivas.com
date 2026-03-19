<?php
/**
 * test-db.php – Database Connection Test
 *
 * Run from command line: php test-db.php
 * Tests PDO MySQL connection, lists database tables.
 */

declare(strict_types=1);

echo "🔌 BhaktaNivas – Database Connection Test\n";
echo "─────────────────────────────────────────\n\n";

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

try {
    $db  = Database::getInstance();
    $row = $db->fetchOne("SELECT VERSION() AS version, NOW() AS now, DATABASE() AS db");

    echo "  ✅  Connected successfully!\n\n";
    echo "  MySQL Version : " . $row['version'] . "\n";
    echo "  Server Time   : " . $row['now']     . "\n";
    echo "  Database      : " . $row['db']      . "\n\n";

    // List tables
    $tables = $db->fetchAll("SHOW TABLES");
    echo "  Tables in database:\n";

    if (empty($tables)) {
        echo "  ⚠️  No tables found. Run 'php migrate.php' first.\n";
    } else {
        foreach ($tables as $t) {
            $tableName = reset($t);
            $count     = $db->fetchOne("SELECT COUNT(*) AS c FROM `{$tableName}`");
            printf("    %-25s %d rows\n", $tableName, (int)$count['c']);
        }
    }

    echo "\n✅  Database test PASSED\n\n";

} catch (\Throwable $e) {
    echo "  ❌  Connection FAILED!\n\n";
    echo "  Error: " . $e->getMessage() . "\n\n";
    echo "  Check your .env settings:\n";
    echo "    DB_HOST = " . (defined('DB_HOST') ? DB_HOST : 'not set') . "\n";
    echo "    DB_NAME = " . (defined('DB_NAME') ? DB_NAME : 'not set') . "\n";
    echo "    DB_USER = " . (defined('DB_USER') ? DB_USER : 'not set') . "\n";
    echo "    DB_PASS = " . (defined('DB_PASS') ? (DB_PASS ? '(set)' : '(empty)') : 'not set') . "\n\n";
    exit(1);
}
