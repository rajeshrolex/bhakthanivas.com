<?php
/**
 * routes/rooms.php – Room Routes
 *
 * GET    /api/rooms?lodgeId=  – List rooms for a lodge (public)
 * GET    /api/rooms/:id       – Single room
 * POST   /api/rooms           – Create room (admin)
 * PUT    /api/rooms/:id       – Update room (admin)
 * DELETE /api/rooms/:id       – Delete room (admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;

// ================================================================ GET /rooms
if ($method === 'GET' && $id === null) {
    $lodgeId = isset($_GET['lodgeId']) ? (int)$_GET['lodgeId'] : null;

    if ($lodgeId) {
        $rooms = $db->fetchAll(
            "SELECT * FROM rooms WHERE lodge_id = ? ORDER BY price ASC",
            [$lodgeId]
        );
    } else {
        $rooms = $db->fetchAll("SELECT * FROM rooms ORDER BY lodge_id, price ASC");
    }

    foreach ($rooms as &$room) {
        $room['amenities'] = json_decode($room['amenities'] ?? '[]', true) ?? [];
    }
    unset($room);

    jsonResponse($rooms);
}

// ============================================================= GET /rooms/:id
if ($method === 'GET' && $id !== null) {
    $room = $db->fetchOne("SELECT * FROM rooms WHERE id = ?", [$id]);

    if (!$room) {
        jsonError('Room not found', 404);
    }
    $room['amenities'] = json_decode($room['amenities'] ?? '[]', true) ?? [];

    jsonResponse($room);
}

// ============================================================ POST /rooms
if ($method === 'POST' && $id === null) {
    requireAuth();

    $body = getBody();

    $required = ['lodgeId', 'type', 'name', 'price', 'totalRooms'];
    foreach ($required as $field) {
        if (!isset($body[$field]) || $body[$field] === '') {
            jsonError("Field '{$field}' is required");
        }
    }

    $validTypes = ['Non-AC', 'AC', 'Family', 'Dormitory'];
    if (!in_array($body['type'], $validTypes, true)) {
        jsonError('Invalid room type. Must be: ' . implode(', ', $validTypes));
    }

    $db->query(
        "INSERT INTO rooms
         (lodge_id, type, name, price, base_guests, extra_guest_price, max_occupancy, total_rooms, available, amenities)
         VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            (int)$body['lodgeId'],
            $body['type'],
            $body['name'],
            (float)$body['price'],
            (int)($body['baseGuests']       ?? 2),
            (float)($body['extraGuestPrice'] ?? 0),
            (int)($body['maxOccupancy']     ?? 2),
            (int)$body['totalRooms'],
            (int)($body['available']        ?? $body['totalRooms']),
            json_encode($body['amenities']  ?? []),
        ]
    );

    $newId = $db->lastInsertId();
    $room  = $db->fetchOne("SELECT * FROM rooms WHERE id = ?", [$newId]);
    $room['amenities'] = json_decode($room['amenities'] ?? '[]', true) ?? [];

    jsonResponse($room, 201);
}

// =========================================================== PUT /rooms/:id
if ($method === 'PUT' && $id !== null) {
    requireAuth();

    $room = $db->fetchOne("SELECT * FROM rooms WHERE id = ?", [$id]);
    if (!$room) {
        jsonError('Room not found', 404);
    }

    $body = getBody();

    $db->query(
        "UPDATE rooms SET
            lodge_id          = ?,
            type              = ?,
            name              = ?,
            price             = ?,
            base_guests       = ?,
            extra_guest_price = ?,
            max_occupancy     = ?,
            total_rooms       = ?,
            available         = ?,
            amenities         = ?
         WHERE id = ?",
        [
            (int)($body['lodgeId']         ?? $room['lodge_id']),
            $body['type']                  ?? $room['type'],
            $body['name']                  ?? $room['name'],
            (float)($body['price']         ?? $room['price']),
            (int)($body['baseGuests']      ?? $room['base_guests']),
            (float)($body['extraGuestPrice']?? $room['extra_guest_price']),
            (int)($body['maxOccupancy']    ?? $room['max_occupancy']),
            (int)($body['totalRooms']      ?? $room['total_rooms']),
            (int)($body['available']       ?? $room['available']),
            json_encode($body['amenities'] ?? json_decode($room['amenities'] ?? '[]', true)),
            $id,
        ]
    );

    $updated = $db->fetchOne("SELECT * FROM rooms WHERE id = ?", [$id]);
    $updated['amenities'] = json_decode($updated['amenities'] ?? '[]', true) ?? [];

    jsonResponse($updated);
}

// ======================================================== DELETE /rooms/:id
if ($method === 'DELETE' && $id !== null) {
    requireAuth();

    $room = $db->fetchOne("SELECT id FROM rooms WHERE id = ?", [$id]);
    if (!$room) {
        jsonError('Room not found', 404);
    }

    $db->query("DELETE FROM rooms WHERE id = ?", [$id]);

    jsonResponse(['success' => true, 'message' => 'Room deleted successfully']);
}

jsonError("Room route not found: {$method}", 404);
