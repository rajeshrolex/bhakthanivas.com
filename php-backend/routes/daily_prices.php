<?php
/**
 * routes/daily_prices.php – Price Calendar Routes
 *
 * GET    /api/daily-prices?lodgeId=&startDate=&endDate= – Get price calendar
 * POST   /api/daily-prices                              – Upsert price entry (admin)
 * DELETE /api/daily-prices/:id                          – Remove override (admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;

// ============================================================== GET
if ($method === 'GET') {
    $lodgeId   = isset($_GET['lodgeId'])   ? (int)$_GET['lodgeId']     : null;
    $startDate = $_GET['startDate'] ?? null;
    $endDate   = $_GET['endDate']   ?? null;

    $where  = [];
    $params = [];

    if ($lodgeId) {
        $where[]  = 'lodge_id = ?';
        $params[] = $lodgeId;
    }
    if ($startDate) {
        $where[]  = 'date >= ?';
        $params[] = $startDate;
    }
    if ($endDate) {
        $where[]  = 'date <= ?';
        $params[] = $endDate;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $prices = $db->fetchAll(
        "SELECT * FROM daily_prices {$whereClause} ORDER BY date ASC",
        $params
    );

    // Map to camelCase for frontend parity
    $mapped = array_map(function($item) {
        return [
            '_id'       => $item['id'],
            'id'        => $item['id'],
            'lodgeId'   => $item['lodge_id'],
            'date'      => $item['date'],
            'roomType'  => $item['room_type'],
            'price'     => $item['price'] !== null ? (float)$item['price'] : null,
            'isBlocked' => (bool)$item['is_blocked'],
            'createdAt' => $item['created_at'] ?? null,
            'updatedAt' => $item['updated_at'] ?? null
        ];
    }, $prices);

    jsonResponse($mapped);
}

// ============================================================== POST bulk-upsert
// POST /api/daily-prices/bulk  — MUST be checked BEFORE single upsert (both have $id === null)
if ($method === 'POST' && ($seg[2] ?? '') === 'bulk') {
    requireAuth();

    $body    = getBody();
    $entries = $body['entries'] ?? [];

    if (!is_array($entries) || empty($entries)) {
        jsonError('entries array is required');
    }

    $inserted = 0;
    $updated  = 0;

    foreach ($entries as $entry) {
        if (empty($entry['lodgeId']) || empty($entry['date']) || empty($entry['roomType'])) continue;

        $existingBulk = $db->fetchOne(
            "SELECT id FROM daily_prices WHERE lodge_id = ? AND date = ? AND room_type = ?",
            [(int)$entry['lodgeId'], $entry['date'], $entry['roomType']]
        );

        $price     = isset($entry['price']) ? (float)$entry['price'] : null;
        $isBlocked = isset($entry['isBlocked']) && $entry['isBlocked'] ? 1 : 0;

        if ($existingBulk) {
            $db->query(
                "UPDATE daily_prices SET price = ?, is_blocked = ? WHERE id = ?",
                [$price, $isBlocked, $existingBulk['id']]
            );
            $updated++;
        } else {
            $db->query(
                "INSERT INTO daily_prices (lodge_id, date, room_type, price, is_blocked) VALUES (?,?,?,?,?)",
                [(int)$entry['lodgeId'], $entry['date'], $entry['roomType'], $price, $isBlocked]
            );
            $inserted++;
        }
    }

    jsonResponse(['success' => true, 'inserted' => $inserted, 'updated' => $updated]);
}

// ============================================================== POST (single upsert)
if ($method === 'POST' && $id === null) {
    requireAuth();

    $body = getBody();

    if (empty($body['lodgeId']) || empty($body['date']) || empty($body['roomType'])) {
        jsonError('lodgeId, date, and roomType are required');
    }

    $validTypes = ['Non-AC', 'AC', 'Family', 'Dormitory'];
    if (!in_array($body['roomType'], $validTypes, true)) {
        jsonError('Invalid roomType');
    }

    $lodgeId   = (int)$body['lodgeId'];
    $date      = $body['date'];
    $roomType  = $body['roomType'];
    $price     = isset($body['price']) ? (float)$body['price'] : null;
    $isBlocked = isset($body['isBlocked']) && $body['isBlocked'] ? 1 : 0;

    // Upsert: update existing or insert new
    $existing = $db->fetchOne(
        "SELECT id FROM daily_prices WHERE lodge_id = ? AND date = ? AND room_type = ?",
        [$lodgeId, $date, $roomType]
    );

    if ($existing) {
        $db->query(
            "UPDATE daily_prices SET price = ?, is_blocked = ? WHERE id = ?",
            [$price, $isBlocked, $existing['id']]
        );
        $id = $existing['id'];
    } else {
        $db->query(
            "INSERT INTO daily_prices (lodge_id, date, room_type, price, is_blocked) VALUES (?,?,?,?,?)",
            [$lodgeId, $date, $roomType, $price, $isBlocked]
        );
        $id = $db->lastInsertId();
    }

    $row = $db->fetchOne("SELECT * FROM daily_prices WHERE id = ?", [$id]);

    $mapped = [
        '_id'       => (int)$row['id'],
        'id'        => (int)$row['id'],
        'lodgeId'   => (int)$row['lodge_id'],
        'date'      => $row['date'],
        'roomType'  => $row['room_type'],
        'price'     => $row['price'] !== null ? (float)$row['price'] : null,
        'isBlocked' => (bool)$row['is_blocked'],
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null
    ];

    jsonResponse(['success' => true, 'price' => $mapped], $existing ? 200 : 201);
}

// ============================================================== DELETE
if ($method === 'DELETE' && $id !== null) {
    requireSuperAdmin();

    $row = $db->fetchOne("SELECT id FROM daily_prices WHERE id = ?", [$id]);
    if (!$row) jsonError('Price entry not found', 404);

    $db->query("DELETE FROM daily_prices WHERE id = ?", [$id]);

    jsonResponse(['success' => true, 'message' => 'Price entry removed']);
}

jsonError("DailyPrice route not found: {$method}", 404);
