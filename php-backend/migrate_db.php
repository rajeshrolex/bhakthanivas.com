<?php
/**
 * migrate_db.php – Standalone migration fix for password_resets table
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();
    
    $sql = "
        CREATE TABLE IF NOT EXISTS password_resets (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email      VARCHAR(255) NOT NULL,
            otp        VARCHAR(10)  NOT NULL,
            expires_at DATETIME     NOT NULL,
            created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_otp   (otp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql);
    
    echo "<h1>Migration Successful!</h1>";
    echo "<p>Table 'password_resets' has been created or already exists.</p>";
    echo "<p><strong>IMPORTANT:</strong> Please delete this file (migrate_db.php) for security after you see this message.</p>";
    echo "<a href='/admin/login'>Back to Login</a>";

} catch (\Throwable $e) {
    echo "<h1>Migration Failed!</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
