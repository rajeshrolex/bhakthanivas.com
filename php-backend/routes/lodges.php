<?php
/**
 * routes/lodges.php – Lodge Routes
 *
 * GET    /api/lodges          – List all lodges (public)
 * GET    /api/lodges/:id      – Single lodge with rooms (public)
 * POST   /api/lodges          – Create lodge (admin)
 * PUT    /api/lodges/:id      – Update lodge (admin)
 * DELETE /api/lodges/:id      – Delete lodge (admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
// seg: ['api','lodges'] or ['api','lodges','123']
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;

// ================================================================ GET /lodges
if ($method === 'GET' && $id === null) {
    $lodges = $db->fetchAll("SELECT * FROM lodges ORDER BY name ASC");

        $lodge['_id'] = $lodge['id'];
        $lodge['priceStarting'] = $lodge['price_starting'];
        $lodge['amenities'] = json_decode($lodge['amenities'] ?? '[]', true) ?? [];
        $lodge['images']    = json_decode($lodge['images']    ?? '[]', true) ?? [];
        $lodge['isBlocked'] = (bool)($lodge['is_blocked'] ?? false);

        // Fetch blocked dates
        $dates = $db->fetchAll("SELECT date FROM blocked_dates WHERE lodge_id = ?", [$lodge['id']]);
        $lodge['blockedDates'] = array_column($dates, 'date');

        // Attach rooms
        $lodge['rooms'] = $db->fetchAll(
            "SELECT * FROM rooms WHERE lodge_id = ? ORDER BY price ASC",
            [$lodge['id']]
        );
        foreach ($lodge['rooms'] as &$room) {
            $room['_id']        = $room['id'];
            $room['baseGuests'] = $room['base_guests'];
            $room['maxOccupancy'] = $room['max_occupancy'];
            $room['extraGuestPrice'] = $room['extra_guest_price'];
            $room['amenities'] = json_decode($room['amenities'] ?? '[]', true) ?? [];
        }
    unset($lodge, $room);

    jsonResponse($lodges);
}

// ============================================================= GET /lodges/:id
if ($method === 'GET' && $idOrSlug !== null && !isset($seg[3])) {
    if (is_numeric($idOrSlug)) {
        $lodge = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [(int)$idOrSlug]);
    } else {
        $lodge = $db->fetchOne("SELECT * FROM lodges WHERE slug = ?", [$idOrSlug]);
    }

    if (!$lodge) {
        jsonError('Lodge not found', 404);
    }

    $lodge['_id'] = $lodge['id'];
    $lodge['priceStarting'] = $lodge['price_starting'];
    $lodge['amenities'] = json_decode($lodge['amenities'] ?? '[]', true) ?? [];
    $lodge['images']    = json_decode($lodge['images']    ?? '[]', true) ?? [];
    $lodge['isBlocked'] = (bool)($lodge['is_blocked'] ?? false);

    // Fetch blocked dates
    $dates = $db->fetchAll("SELECT date FROM blocked_dates WHERE lodge_id = ?", [$lodge['id']]);
    $lodge['blockedDates'] = array_column($dates, 'date');

    $lodge['rooms'] = $db->fetchAll(
        "SELECT * FROM rooms WHERE lodge_id = ? ORDER BY price ASC",
        [$lodge['id']]
    );
    foreach ($lodge['rooms'] as &$room) {
        $room['_id']        = $room['id'];
        $room['baseGuests'] = $room['base_guests'];
        $room['maxOccupancy'] = $room['max_occupancy'];
        $room['extraGuestPrice'] = $room['extra_guest_price'];
        $room['amenities'] = json_decode($room['amenities'] ?? '[]', true) ?? [];
    }
    unset($room);

    jsonResponse($lodge);
}

// ============================================================ POST /lodges
if ($method === 'POST' && $id === null) {
    requireAuth();

    $body = getBody();

    $required = ['name', 'priceStarting'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            jsonError("Field '{$field}' is required");
        }
    }

    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['name']));
    // Ensure unique slug
    $count = 0;
    $baseSlug = $slug;
    while ($db->fetchOne("SELECT id FROM lodges WHERE slug = ?", [$slug])) {
        $count++;
        $slug = "{$baseSlug}-{$count}";
    }

    $db->query(
        "INSERT INTO lodges
         (name, slug, tagline, images, distance, distance_type, rating, review_count,
          price_starting, availability, featured, amenities, address, phone, whatsapp,
          description, is_blocked, terms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $body['name'],
            $slug,
            $body['tagline']      ?? '',
            json_encode($body['images']    ?? []),
            $body['distance']     ?? '',
            $body['distanceType'] ?? 'walkable',
            $body['rating']       ?? 0,
            $body['reviewCount']  ?? 0,
            $body['priceStarting'],
            $body['availability'] ?? 'available',
            isset($body['featured']) && $body['featured'] ? 1 : 0,
            json_encode($body['amenities'] ?? []),
            $body['address']      ?? '',
            $body['phone']        ?? '',
            $body['whatsapp']     ?? '',
            $body['description']  ?? '',
            isset($body['isBlocked']) && $body['isBlocked'] ? 1 : 0,
            $body['terms']        ?? "1. Check-in: 12:00 PM, Check-out: 11:00 AM.\n2. Please carry a valid ID proof.\n3. Standard cancellation policies apply.",
        ]
    );

    $newId  = $db->lastInsertId();
    $lodge  = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$newId]);
    $lodge['amenities'] = json_decode($lodge['amenities'] ?? '[]', true) ?? [];
    $lodge['images']    = json_decode($lodge['images']    ?? '[]', true) ?? [];

    jsonResponse(['success' => true, 'lodge' => $lodge], 201);
}

// =========================================================== PUT /lodges/:id
if ($method === 'PUT' && $id !== null) {
    requireAuth();

    $lodge = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$id]);
    if (!$lodge) {
        jsonError('Lodge not found', 404);
    }

    $body = getBody();

    $db->query(
        "UPDATE lodges SET
            name          = ?,
            tagline       = ?,
            images        = ?,
            distance      = ?,
            distance_type = ?,
            price_starting= ?,
            availability  = ?,
            featured      = ?,
            amenities     = ?,
            address       = ?,
            phone         = ?,
            whatsapp      = ?,
            description   = ?,
            is_blocked    = ?,
            terms         = ?
         WHERE id = ?",
        [
            $body['name']         ?? $lodge['name'],
            $body['tagline']      ?? $lodge['tagline'],
            json_encode($body['images']    ?? json_decode($lodge['images'] ?? '[]', true)),
            $body['distance']     ?? $lodge['distance'],
            $body['distanceType'] ?? $lodge['distance_type'],
            $body['priceStarting']?? $lodge['price_starting'],
            $body['availability'] ?? $lodge['availability'],
            isset($body['featured'])  ? ($body['featured']  ? 1 : 0) : $lodge['featured'],
            json_encode($body['amenities'] ?? json_decode($lodge['amenities'] ?? '[]', true)),
            $body['address']      ?? $lodge['address'],
            $body['phone']        ?? $lodge['phone'],
            $body['whatsapp']     ?? $lodge['whatsapp'],
            $body['description']  ?? $lodge['description'],
            isset($body['isBlocked']) ? ($body['isBlocked'] ? 1 : 0) : $lodge['is_blocked'],
            $body['terms']        ?? $lodge['terms'],
            $id,
        ]
    );

    $updated = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$id]);
    $updated['amenities'] = json_decode($updated['amenities'] ?? '[]', true) ?? [];
    $updated['images']    = json_decode($updated['images']    ?? '[]', true) ?? [];

    jsonResponse(['success' => true, 'lodge' => $updated]);
}

// ======================================================== DELETE /lodges/:id
if ($method === 'DELETE' && $id !== null) {
    requireSuperAdmin();

    $lodge = $db->fetchOne("SELECT id FROM lodges WHERE id = ?", [$id]);
    if (!$lodge) {
        jsonError('Lodge not found', 404);
    }

    $db->query("DELETE FROM lodges WHERE id = ?", [$id]);

    jsonResponse(['success' => true, 'message' => 'Lodge deleted successfully']);
}

jsonError("Lodge route not found: {$method}", 404);
