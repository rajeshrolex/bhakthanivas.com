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

$idOrSlug = $seg[2] ?? null;
$id       = ($idOrSlug !== null && is_numeric($idOrSlug)) ? (int)$idOrSlug : null;

/**
 * Helper to add frontend-compatible fields to a lodge array
 */
function enrichLodge(array $lodge, Database $db): array
{
    $lodge['_id']           = $lodge['id'];
    $lodge['priceStarting']= (float)($lodge['price_starting'] ?? 0);
    $lodge['distanceType'] = $lodge['distance_type'] ?? 'walkable';
    $lodge['amenities']    = json_decode($lodge['amenities'] ?? '[]', true) ?? [];
    $lodge['images']       = json_decode($lodge['images']    ?? '[]', true) ?? [];
    $lodge['isBlocked']    = (bool)($lodge['is_blocked'] ?? false);
    $lodge['isFeatured']   = (bool)($lodge['featured']   ?? false);
    $lodge['featured']     = (bool)($lodge['featured']   ?? false); // Duplicated for frontend parity
    $lodge['googleMapsLink'] = $lodge['google_maps_link'] ?? '';

    // Fetch blocked dates
    $dates = $db->fetchAll("SELECT date FROM blocked_dates WHERE lodge_id = ?", [$lodge['id']]);
    $lodge['blockedDates'] = array_column($dates, 'date');

    // Attach rooms
    $rooms = $db->fetchAll(
        "SELECT * FROM rooms WHERE lodge_id = ? ORDER BY price ASC",
        [$lodge['id']]
    );
    foreach ($rooms as &$room) {
        $room['_id']             = $room['id'];
        $room['baseGuests']      = $room['base_guests'];
        $room['maxOccupancy']    = $room['max_occupancy'];
        $room['extraGuestPrice'] = $room['extra_guest_price'];
        $room['amenities']       = json_decode($room['amenities'] ?? '[]', true) ?? [];
    }
    $lodge['rooms'] = $rooms;

    return $lodge;
}

// ================================================================ GET /lodges
if ($method === 'GET' && $idOrSlug === null) {
    $lodges = $db->fetchAll("SELECT * FROM lodges ORDER BY name ASC");

    foreach ($lodges as &$lodge) {
        $lodge = enrichLodge($lodge, $db);
    }
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

    $lodge = enrichLodge($lodge, $db);

    // --- Dynamic availability based on date range (mirrors Node.js lodgeRoutes.js) ---
    $checkIn  = $_GET['checkIn']  ?? null;
    $checkOut = $_GET['checkOut'] ?? null;

    if ($checkIn && $checkOut) {
        $ciDate = new \DateTime($checkIn  . ' 00:00:00');
        $coDate = new \DateTime($checkOut . ' 00:00:00');

        if ($ciDate < $coDate) {
            // Fetch all overlapping bookings: checkIn < coDate AND checkOut > ciDate
            $overlapping = $db->fetchAll(
                "SELECT room_name, rooms, check_in, check_out
                 FROM bookings
                 WHERE lodge_id = ?
                   AND status NOT IN ('cancelled','checked-out')
                   AND check_in < ? AND check_out > ?",
                [(int)$lodge['id'], $checkOut, $checkIn]
            );

            // Build each night in the requested stay [checkIn, checkOut)
            $nights = [];
            $cur    = clone $ciDate;
            while ($cur < $coDate) {
                $nights[] = $cur->format('Y-m-d');
                $cur->modify('+1 day');
            }

            // For each room name, find the PEAK occupancy across all nights
            $peakOccupancyByName = [];
            foreach ($nights as $nightStr) {
                $nightDate = new \DateTime($nightStr . ' 00:00:00');
                $nightCountByName = [];
                foreach ($overlapping as $bk) {
                    $bkIn  = new \DateTime(substr($bk['check_in'],  0, 10) . ' 00:00:00');
                    $bkOut = new \DateTime(substr($bk['check_out'], 0, 10) . ' 00:00:00');
                    // booking covers this night if checkIn <= night < checkOut
                    if ($bkIn <= $nightDate && $nightDate < $bkOut && !empty($bk['room_name'])) {
                        $cnt = (int)($bk['rooms'] ?? 1);
                        $nightCountByName[$bk['room_name']] = ($nightCountByName[$bk['room_name']] ?? 0) + $cnt;
                    }
                }
                // Update peak for each room name
                foreach ($nightCountByName as $rname => $cnt) {
                    $peakOccupancyByName[$rname] = max($peakOccupancyByName[$rname] ?? 0, $cnt);
                }
            }

            // Overwrite available field on each room with dynamic count
            $lodge['rooms'] = array_map(function ($room) use ($peakOccupancyByName) {
                $baseCapacity    = (int)($room['available'] ?? 0);
                $peakBooked      = (int)($peakOccupancyByName[$room['name']] ?? 0);
                $dynamicAvailable = max(0, $baseCapacity - $peakBooked);
                $room['available'] = $dynamicAvailable;
                return $room;
            }, $lodge['rooms']);
        }
    }

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
         (name, slug, tagline, images, distance, distance_type, google_maps_link,
          price_starting, availability, featured, amenities, address, phone, whatsapp,
          description, is_blocked, terms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $body['name'],
            $slug,
            $body['tagline']      ?? '',
            json_encode($body['images']    ?? []),
            $body['distance']     ?? '',
            $body['distanceType'] ?? 'walkable',
            $body['googleMapsLink'] ?? '',
            $body['priceStarting'],
            $body['availability'] ?? 'available',
            isset($body['featured']) && $body['featured'] ? 1 : 0,
            json_encode($body['amenities'] ?? []),
            $body['address']      ?? '',
            $body['phone']        ?? '',
            $body['whatsapp']     ?? '',
            $body['description']  ?? '',
            isset($body['isBlocked']) && $body['isBlocked'] ? 1 : 0,
            $body['terms']        ?? "1. Check-in: 12:00 PM, Check-out: 11:00 AM.\n2. Please carry a valid ID proof (Aadhar/Passport/DL).\n3. Standard cancellation policies apply.",
        ]
    );

    $newId  = (int)$db->lastInsertId();

    // Synchronization of rooms (if provided)
    if (isset($body['rooms']) && is_array($body['rooms'])) {
        foreach ($body['rooms'] as $rm) {
            $db->query(
                "INSERT INTO rooms
                 (lodge_id, type, name, price, base_guests, extra_guest_price, max_occupancy, total_rooms, available, amenities)
                 VALUES (?,?,?,?,?,?,?,?,?,?)",
                [
                    $newId,
                    $rm['type']              ?? 'Non-AC',
                    $rm['name']              ?? ($rm['type'] ?? 'Standard'),
                    (float)($rm['price']     ?? 0),
                    (int)($rm['baseGuests']  ?? 2),
                    (float)($rm['extraGuestPrice'] ?? 0),
                    (int)($rm['maxOccupancy'] ?? 2),
                    (int)($rm['totalRooms']  ?? 0),
                    (int)($rm['available']   ?? ($rm['totalRooms'] ?? 0)),
                    json_encode($rm['amenities'] ?? []),
                ]
            );
        }
    }

    $lodge  = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$newId]);
    $lodge  = enrichLodge($lodge, $db);

    jsonResponse($lodge, 201);
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
            google_maps_link = ?,
            is_blocked    = ?,
            terms         = ?
         WHERE id = ?",
        [
            $body['name']         ?? $lodge['name'],
            $body['tagline']      ?? $lodge['tagline'],
            json_encode($body['images']    ?? json_decode($lodge['images'] ?? '[]', true)),
            $body['distance']     ?? $lodge['distance'],
            $body['distanceType'] ?? $lodge['distance_type'] ?? $body['distance_type'],
            $body['priceStarting']?? $lodge['price_starting']?? $body['price_starting'],
            $body['availability'] ?? $lodge['availability'],
            // isFeatured fallback
            isset($body['isFeatured']) ? ($body['isFeatured'] ? 1 : 0) : (isset($body['featured']) ? ($body['featured'] ? 1 : 0) : $lodge['featured']),
            json_encode($body['amenities'] ?? json_decode($lodge['amenities'] ?? '[]', true)),
            $body['address']      ?? $lodge['address'],
            $body['phone']        ?? $lodge['phone'],
            $body['whatsapp']     ?? $lodge['whatsapp'],
            $body['description']  ?? $lodge['description'],
            $body['googleMapsLink'] ?? $lodge['google_maps_link'] ?? '',
            // isBlocked fallback
            isset($body['isBlocked']) ? ($body['isBlocked'] ? 1 : 0) : $lodge['is_blocked'],
            $body['terms']        ?? $lodge['terms'],
            $id,
        ]
    );

    // Synchronization of rooms (if provided) - Delete and Recreate parity with Node.js
    if (isset($body['rooms']) && is_array($body['rooms'])) {
        $db->query("DELETE FROM rooms WHERE lodge_id = ?", [$id]);
        foreach ($body['rooms'] as $rm) {
            $db->query(
                "INSERT INTO rooms
                 (lodge_id, type, name, price, base_guests, extra_guest_price, max_occupancy, total_rooms, available, amenities)
                 VALUES (?,?,?,?,?,?,?,?,?,?)",
                [
                    $id,
                    $rm['type']              ?? 'Non-AC',
                    $rm['name']              ?? ($rm['type'] ?? 'Standard'),
                    (float)($rm['price']     ?? 0),
                    (int)($rm['baseGuests']  ?? 2),
                    (float)($rm['extraGuestPrice'] ?? 0),
                    (int)($rm['maxOccupancy'] ?? 2),
                    (int)($rm['totalRooms']  ?? 0),
                    (int)($rm['available']   ?? ($rm['totalRooms'] ?? 0)),
                    json_encode($rm['amenities'] ?? []),
                ]
            );
        }
    }

    $updated = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$id]);
    $updated = enrichLodge($updated, $db);

    jsonResponse($updated);
}

// =================================================== PATCH /lodges/:id/block-toggle
if ($method === 'PATCH' && $id !== null && isset($seg[3]) && $seg[3] === 'block-toggle') {
    requireSuperAdmin();

    $lodge = $db->fetchOne("SELECT id, is_blocked FROM lodges WHERE id = ?", [$id]);
    if (!$lodge) {
        jsonError('Lodge not found', 404);
    }

    $newVal = $lodge['is_blocked'] ? 0 : 1;
    $db->query("UPDATE lodges SET is_blocked = ? WHERE id = ?", [$newVal, $id]);

    $updated = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$id]);
    $updated = enrichLodge($updated, $db);

    jsonResponse($updated);
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
