<?php
/**
 * migrate.php – Database Migration Script
 *
 * Creates all MySQL tables for the BhaktaNivas system.
 * Run once on the server: php migrate.php
 *
 * Tables created:
 *   users, lodges, rooms, bookings, daily_prices, blocked_dates, reviews
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

$pdo = Database::getInstance()->getPdo();

echo "🚀 BhaktaNivas – Running Database Migration...\n\n";

$tables = [

    // ---------------------------------------------------------------- users
    'users' => "
        CREATE TABLE IF NOT EXISTS users (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255)  NOT NULL,
            email      VARCHAR(255)  NOT NULL UNIQUE,
            password   VARCHAR(255)  NOT NULL,
            phone      VARCHAR(20)   DEFAULT '',
            role       ENUM('super_admin','admin') NOT NULL DEFAULT 'admin',
            lodge_id   INT UNSIGNED  DEFAULT NULL,
            created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role  (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- lodges
    'lodges' => "
        CREATE TABLE IF NOT EXISTS lodges (
            id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name          VARCHAR(255) NOT NULL,
            slug          VARCHAR(255) NOT NULL UNIQUE,
            tagline       TEXT,
            images        JSON,
            distance      VARCHAR(100) DEFAULT '',
            distance_type ENUM('walkable','auto') DEFAULT 'walkable',
            rating        DECIMAL(3,1) UNSIGNED DEFAULT 0.0,
            review_count  INT UNSIGNED DEFAULT 0,
            price_starting DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
            availability  ENUM('available','limited','full') DEFAULT 'available',
            featured      TINYINT(1) DEFAULT 0,
            amenities     JSON,
            address       TEXT,
            phone         VARCHAR(50),
            whatsapp      VARCHAR(50),
            description   TEXT,
            is_blocked    TINYINT(1) DEFAULT 0,
            terms         TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_slug (slug),
            INDEX idx_featured (featured)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- rooms
    'rooms' => "
        CREATE TABLE IF NOT EXISTS rooms (
            id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            lodge_id          INT UNSIGNED NOT NULL,
            type              ENUM('Non-AC','AC','Family','Dormitory') NOT NULL,
            name              VARCHAR(255) NOT NULL,
            price             DECIMAL(10,2) UNSIGNED NOT NULL,
            base_guests       TINYINT UNSIGNED DEFAULT 2,
            extra_guest_price DECIMAL(10,2) UNSIGNED DEFAULT 0,
            max_occupancy     TINYINT UNSIGNED DEFAULT 2,
            total_rooms       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            available         SMALLINT UNSIGNED DEFAULT 0,
            amenities         JSON,
            FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE,
            INDEX idx_lodge_type (lodge_id, type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- bookings
    'bookings' => "
        CREATE TABLE IF NOT EXISTS bookings (
            id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            booking_id      VARCHAR(20)  NOT NULL UNIQUE,
            lodge_id        INT UNSIGNED NOT NULL,
            lodge_name      VARCHAR(255),
            room_id         INT UNSIGNED,
            room_type       VARCHAR(50),
            room_name       VARCHAR(255),
            room_price      DECIMAL(10,2) UNSIGNED DEFAULT 0,
            check_in        DATE         NOT NULL,
            check_out       DATE         NOT NULL,
            check_in_time   VARCHAR(10)  DEFAULT '12:00',
            guests          TINYINT UNSIGNED DEFAULT 1,
            rooms           TINYINT UNSIGNED DEFAULT 1,
            customer_name   VARCHAR(255) NOT NULL,
            customer_mobile VARCHAR(20)  NOT NULL,
            customer_email  VARCHAR(255) DEFAULT '',
            id_type         VARCHAR(50)  DEFAULT '',
            id_number       VARCHAR(100) DEFAULT '',
            payment_method  ENUM('payAtLodge','online') DEFAULT 'payAtLodge',
            payment_id      VARCHAR(255) DEFAULT NULL,
            payment_status  ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
            total_amount    DECIMAL(10,2) UNSIGNED NOT NULL,
            amount_paid     DECIMAL(10,2) UNSIGNED DEFAULT 0,
            balance_amount  DECIMAL(10,2) UNSIGNED DEFAULT 0,
            status          ENUM('pending','confirmed','checked-in','checked-out','cancelled') DEFAULT 'pending',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_booking_id    (booking_id),
            INDEX idx_lodge_id      (lodge_id),
            INDEX idx_room_id       (room_id),
            INDEX idx_status        (status),
            INDEX idx_check_in      (check_in),
            INDEX idx_customer_name (customer_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- daily_prices
    'daily_prices' => "
        CREATE TABLE IF NOT EXISTS daily_prices (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            lodge_id   INT UNSIGNED NOT NULL,
            date       DATE         NOT NULL,
            room_type  ENUM('Non-AC','AC','Family','Dormitory') NOT NULL,
            price      DECIMAL(10,2) UNSIGNED DEFAULT NULL,
            is_blocked TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_lodge_date_type (lodge_id, date, room_type),
            FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE,
            INDEX idx_lodge_date (lodge_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- blocked_dates
    'blocked_dates' => "
        CREATE TABLE IF NOT EXISTS blocked_dates (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            lodge_id   INT UNSIGNED NOT NULL,
            date       DATE         NOT NULL,
            reason     VARCHAR(500) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_lodge_date (lodge_id, date),
            FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

    // ---------------------------------------------------------------- reviews
    'reviews' => "
        CREATE TABLE IF NOT EXISTS reviews (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            lodge_id   INT UNSIGNED NOT NULL,
            name       VARCHAR(255) NOT NULL,
            rating     TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment    TEXT         NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE,
            INDEX idx_lodge_rating (lodge_id, rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",

];

$success = 0;
$errors  = 0;

foreach ($tables as $name => $sql) {
    try {
        $pdo->exec($sql);
        echo "  ✅  Table '{$name}' created / already exists\n";
        $success++;
    } catch (\PDOException $e) {
        echo "  ❌  Table '{$name}' FAILED: " . $e->getMessage() . "\n";
        $errors++;
    }
}

// Add FK for users.lodge_id (after lodges table exists)
try {
    $pdo->exec("
        ALTER TABLE users
        ADD CONSTRAINT IF NOT EXISTS fk_users_lodge
        FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE SET NULL
    ");
    echo "  ✅  Foreign key users.lodge_id -> lodges.id\n";
} catch (\PDOException $e) {
    // Ignore if FK already exists or not supported
}

// Add FK for bookings.room_id
try {
    $pdo->exec("
        ALTER TABLE bookings
        ADD CONSTRAINT IF NOT EXISTS fk_bookings_room
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
    ");
    echo "  ✅  Foreign key bookings.room_id -> rooms.id\n";
} catch (\PDOException $e) {
    // Ignore if already exists
}

echo "\n";
echo "─────────────────────────────────────────────\n";
echo "  Migration complete: {$success} tables OK, {$errors} errors\n";
echo "─────────────────────────────────────────────\n";

if ($errors === 0) {
    echo "\n🎉 All tables created successfully!\n";
    echo "   Next step: php seed-products.php\n\n";
} else {
    echo "\n⚠️  Some tables failed. Check your DB credentials in .env\n\n";
}
