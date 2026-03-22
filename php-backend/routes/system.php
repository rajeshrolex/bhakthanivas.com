<?php
/**
 * routes/system.php – System Management Routes
 * 
 * POST /api/system/migrate – Run database migrations
 */

declare(strict_types=1);

$db     = Database::getInstance();
$pdo    = $db->getPdo();
$method = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();
$action = $segments[2] ?? '';

// Check if Super Admin
requireSuperAdmin();

if ($method === 'POST' && $action === 'migrate') {
    $results = [];
    
    // Core tables definition (synchronized with migrate.php)
    $tables = [
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
        'lodges' => "
            CREATE TABLE IF NOT EXISTS lodges (
                id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name          VARCHAR(255) NOT NULL,
                slug          VARCHAR(255) NOT NULL UNIQUE,
                tagline       TEXT,
                images        LONGTEXT,
                distance      VARCHAR(100) DEFAULT '',
                distance_type ENUM('walkable','auto') DEFAULT 'walkable',
                rating        DECIMAL(3,1) UNSIGNED DEFAULT 0.0,
                review_count  INT UNSIGNED DEFAULT 0,
                price_starting DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
                availability  ENUM('available','limited','full') DEFAULT 'available',
                featured      TINYINT(1) DEFAULT 0,
                amenities     LONGTEXT,
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
                amenities         LONGTEXT,
                FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE,
                INDEX idx_lodge_type (lodge_id, type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
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
        'reviews' => "
            CREATE TABLE IF NOT EXISTS reviews (
                id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                lodge_id   INT UNSIGNED NOT NULL,
                name       VARCHAR(255) NOT NULL,
                rating     TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
                comment    TEXT         NOT NULL,
                created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE CASCADE,
                INDEX idx_lodge_rating (lodge_id, rating)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'temples' => "
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
                updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'password_resets' => "
            CREATE TABLE IF NOT EXISTS password_resets (
                id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                email      VARCHAR(255) NOT NULL,
                otp        VARCHAR(10)  NOT NULL,
                expires_at DATETIME     NOT NULL,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_otp   (otp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
    ];

    $successCount = 0;
    $errorCount = 0;

    foreach ($tables as $name => $sql) {
        try {
            $pdo->exec($sql);
            $results[] = "Table '{$name}' OK";
            $successCount++;
        } catch (\PDOException $e) {
            $results[] = "Table '{$name}' FAILED: " . $e->getMessage();
            $errorCount++;
        }
    }

    // Add FKs if missing
    $alterations = [
        "ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_lodge FOREIGN KEY (lodge_id) REFERENCES lodges(id) ON DELETE SET NULL",
        "ALTER TABLE bookings ADD CONSTRAINT IF NOT EXISTS fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL",
        "ALTER TABLE lodges MODIFY COLUMN images LONGTEXT",
        "ALTER TABLE lodges MODIFY COLUMN amenities LONGTEXT",
        "ALTER TABLE rooms MODIFY COLUMN amenities LONGTEXT",
        "ALTER TABLE temples MODIFY COLUMN images LONGTEXT"
    ];

    foreach ($alterations as $sql) {
        try {
            $pdo->exec($sql);
        } catch (\PDOException $e) {
            // Ignore if fails (e.g. constraint already exists or column type already correct)
        }
    }

    jsonResponse([
        'success'      => $errorCount === 0,
        'message'      => $errorCount === 0 ? 'Database migration successful' : 'Migration completed with some errors',
        'details'      => $results,
        'successCount' => $successCount,
        'errorCount'   => $errorCount
    ]);
}

jsonError("Unknown system action: /api/system/{$action}", 404);
