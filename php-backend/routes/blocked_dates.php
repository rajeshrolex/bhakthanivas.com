<?php
/**
 * routes/blocked_dates.php – Blocked Dates Routes
 *
 * GET    /api/blocked-dates?lodgeId=  – List blocked dates
 * POST   /api/blocked-dates           – Block a date (admin)
 * DELETE /api/blocked-dates/:id       – Unblock a date (admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;

// ============================================================== GET
if ($method === 'GET') {
    $where  = [];
    $params = [];

    if (!empty($_GET['lodgeId'])) {
        $where[]  = 'lodge_id = ?';
        $params[] = (int)$_GET['lodgeId'];
    }
    if (!empty($_GET['startDate'])) {
        $where[]  = 'date >= ?';
        $params[] = $_GET['startDate'];
    }
    if (!empty($_GET['endDate'])) {
        $where[]  = 'date <= ?';
        $params[] = $_GET['endDate'];
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $dates = $db->fetchAll(
        "SELECT * FROM blocked_dates {$whereClause} ORDER BY date ASC",
        $params
    );

    jsonResponse(['success' => true, 'blockedDates' => $dates]);
}

// ============================================================== POST
if ($method === 'POST' && $id === null) {
    requireAuth();

    $body = getBody();

    if (empty($body['lodgeId']) || empty($body['date'])) {
        jsonError('lodgeId and date are required');
    }

    $lodgeId = (int)$body['lodgeId'];
    $date    = $body['date'];
    $reason  = $body['reason'] ?? '';

    // Prevent duplicate
    $existing = $db->fetchOne(
        "SELECT id FROM blocked_dates WHERE lodge_id = ? AND date = ?",
        [$lodgeId, $date]
    );

    if ($existing) {
        jsonError('This date is already blocked for the lodge', 409);
    }

    $db->query(
        "INSERT INTO blocked_dates (lodge_id, date, reason) VALUES (?,?,?)",
        [$lodgeId, $date, $reason]
    );

    $row = $db->fetchOne("SELECT * FROM blocked_dates WHERE id = ?", [$db->lastInsertId()]);

    jsonResponse(['success' => true, 'blockedDate' => $row], 201);
}

// ============================================================== POST bulk
if ($method === 'POST' && ($seg[2] ?? '') === 'bulk') {
    requireAuth();

    $body  = getBody();
    $dates = $body['dates'] ?? [];  // [{lodgeId, date, reason}]

    if (!is_array($dates) || empty($dates)) {
        jsonError('dates array is required');
    }

    $added   = 0;
    $skipped = 0;

    foreach ($dates as $entry) {
        if (empty($entry['lodgeId']) || empty($entry['date'])) { $skipped++; continue; }

        $exists = $db->fetchOne(
            "SELECT id FROM blocked_dates WHERE lodge_id = ? AND date = ?",
            [(int)$entry['lodgeId'], $entry['date']]
        );

        if ($exists) { $skipped++; continue; }

        $db->query(
            "INSERT INTO blocked_dates (lodge_id, date, reason) VALUES (?,?,?)",
            [(int)$entry['lodgeId'], $entry['date'], $entry['reason'] ?? '']
        );
        $added++;
    }

    jsonResponse(['success' => true, 'added' => $added, 'skipped' => $skipped]);
}

// ============================================================== DELETE
if ($method === 'DELETE' && $id !== null) {
    requireAuth();

    $row = $db->fetchOne("SELECT id FROM blocked_dates WHERE id = ?", [$id]);
    if (!$row) jsonError('Blocked date not found', 404);

    $db->query("DELETE FROM blocked_dates WHERE id = ?", [$id]);

    jsonResponse(['success' => true, 'message' => 'Date unblocked successfully']);
}

jsonError("BlockedDate route not found: {$method}", 404);
