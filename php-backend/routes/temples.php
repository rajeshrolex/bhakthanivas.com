<?php
/**
 * routes/temples.php – Temple Management Routes
 *
 * GET    /api/temples      – Get all temples
 * GET    /api/temples/:id  – Get single temple
 * POST   /api/temples      – Create temple (admin only)
 * PUT    /api/temples/:id  – Update temple (admin only)
 * DELETE /api/temples/:id  – Delete temple (admin only)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$rawId  = $seg[2] ?? null;

// ============================================================ GET /temples
if ($method === 'GET' && $rawId === null) {
    $temples = $db->fetchAll("SELECT * FROM temples ORDER BY name ASC");
    
    $enriched = array_map(function($t) {
        return [
            '_id'              => $t['id'],
            'id'               => $t['id'],
            'name'             => $t['name'],
            'location'         => $t['location'],
            'googleMapsLink'   => $t['google_maps_link'],
            'distance'         => $t['distance'],
            'darshanTimings'   => $t['darshan_timings'],
            'specialDarshanTimings' => $t['special_darshan_timings'],
            'nearbyRailwayStationTitle' => $t['nearby_railway_station_title'],
            'nearbyRailwayStation'      => $t['nearby_railway_station'],
            'busTimingsTitle'  => $t['bus_timings_title'],
            'busTimings'       => $t['bus_timings'],
            'description'      => $t['description'],
            'additionalInfo'   => $t['additional_info'],
            'images'           => !empty($t['images']) ? json_decode($t['images'], true) : [],
            'createdAt'        => $t['created_at'],
            'updatedAt'        => $t['updated_at']
        ];
    }, $temples);
    
    jsonResponse($enriched);
}

// ============================================================ GET /temples/:id
if ($method === 'GET' && $rawId !== null) {
    $t = $db->fetchOne("SELECT * FROM temples WHERE id = ?", [(int)$rawId]);
    if (!$t) jsonError('Temple not found', 404);
    
    jsonResponse([
        '_id'              => $t['id'],
        'id'               => $t['id'],
        'name'             => $t['name'],
        'location'         => $t['location'],
        'googleMapsLink'   => $t['google_maps_link'],
        'distance'         => $t['distance'],
        'darshanTimings'   => $t['darshan_timings'],
        'specialDarshanTimings' => $t['special_darshan_timings'],
        'nearbyRailwayStationTitle' => $t['nearby_railway_station_title'],
        'nearbyRailwayStation'      => $t['nearby_railway_station'],
        'busTimingsTitle'  => $t['bus_timings_title'],
        'busTimings'       => $t['bus_timings'],
        'description'      => $t['description'],
        'additionalInfo'   => $t['additional_info'],
        'images'           => !empty($t['images']) ? json_decode($t['images'], true) : [],
        'createdAt'        => $t['created_at'],
        'updatedAt'        => $t['updated_at']
    ]);
}

// ============================================================ POST /temples
if ($method === 'POST') {
    requireAuth(); // Adjust level if needed, e.g., requireSuperAdmin()
    $body = getBody();
    
    if (empty($body['name'])) jsonError('Temple name is required');
    
    $db->query(
        "INSERT INTO temples (
            name, location, google_maps_link, distance, darshan_timings,
            special_darshan_timings, nearby_railway_station_title, nearby_railway_station,
            bus_timings_title, bus_timings, description, additional_info, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $body['name'],
            $body['location'] ?? '',
            $body['googleMapsLink'] ?? '',
            $body['distance'] ?? '',
            $body['darshanTimings'] ?? '',
            $body['specialDarshanTimings'] ?? '',
            $body['nearbyRailwayStationTitle'] ?? 'Nearby Railway Station',
            $body['nearbyRailwayStation'] ?? '',
            $body['busTimingsTitle'] ?? 'Bus Timings',
            $body['busTimings'] ?? '',
            $body['description'] ?? '',
            $body['additionalInfo'] ?? '',
            json_encode($body['images'] ?? [])
        ]
    );
    
    jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

// ============================================================ PUT /temples/:id
if ($method === 'PUT' && $rawId !== null) {
    requireAuth();
    $body = getBody();
    $id = (int)$rawId;
    
    $temple = $db->fetchOne("SELECT id FROM temples WHERE id = ?", [$id]);
    if (!$temple) jsonError('Temple not found', 404);
    
    $db->query(
        "UPDATE temples SET
            name = ?, location = ?, google_maps_link = ?, distance = ?,
            darshan_timings = ?, special_darshan_timings = ?,
            nearby_railway_station_title = ?, nearby_railway_station = ?,
            bus_timings_title = ?, bus_timings = ?,
            description = ?, additional_info = ?, images = ?
         WHERE id = ?",
        [
            $body['name'],
            $body['location'] ?? '',
            $body['googleMapsLink'] ?? '',
            $body['distance'] ?? '',
            $body['darshanTimings'] ?? '',
            $body['specialDarshanTimings'] ?? '',
            $body['nearbyRailwayStationTitle'] ?? 'Nearby Railway Station',
            $body['nearbyRailwayStation'] ?? '',
            $body['busTimingsTitle'] ?? 'Bus Timings',
            $body['busTimings'] ?? '',
            $body['description'] ?? '',
            $body['additionalInfo'] ?? '',
            json_encode($body['images'] ?? []),
            $id
        ]
    );
    
    jsonResponse(['success' => true]);
}

// ============================================================ DELETE /temples/:id
if ($method === 'DELETE' && $rawId !== null) {
    requireAuth();
    $id = (int)$rawId;
    
    $db->query("DELETE FROM temples WHERE id = ?", [$id]);
    jsonResponse(['success' => true]);
}

jsonError("Temple route not found: {$method} /api/temples/{$rawId}", 404);
