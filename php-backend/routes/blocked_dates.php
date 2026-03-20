<?php
/**
 * routes/blocked_dates.php – Blocked Dates Routes (Strict Node.js Parity)
 *
 * GET    /api/blocked-dates/:lodgeId/month/:monthStr  – Get by month (regex equivalent)
 * GET    /api/blocked-dates/:lodgeId                   – Get all by lodge
 * GET    /api/blocked-dates?lodgeId=                   – List blocked dates
 * POST   /api/blocked-dates                            – Block a date (super_admin)
 * DELETE /api/blocked-dates/:id                        – Unblock a date (super_admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();

// ============================================================== GET
if ($method === 'GET') {
    $lodgeId  = null;
    $monthStr = null;

    // Pattern: /api/blocked-dates/:lodgeId/month/:monthStr
    if (isset($seg[2]) && is_numeric($seg[2]) && ($seg[3] ?? '') === 'month' && isset($seg[4])) {
        $lodgeId  = (int)$seg[2];
        $monthStr = $seg[4]; // YYYY-MM
        
        $blocks = $db->fetchAll(
            "SELECT * FROM blocked_dates WHERE lodge_id = ? AND date LIKE ?",
            [$lodgeId, "{$monthStr}%"]
        );
        jsonResponse($blocks);
    }

    // Pattern: /api/blocked-dates/:lodgeId
    if (isset($seg[2]) && is_numeric($seg[2]) && !isset($seg[3])) {
        $lodgeId = (int)$seg[2];
        $blocks  = $db->fetchAll("SELECT * FROM blocked_dates WHERE lodge_id = ?", [$lodgeId]);
        jsonResponse($blocks);
    }

    // Pattern: /api/blocked-dates?lodgeId=
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
    jsonResponse($dates);
}

// ============================================================== POST
if ($method === 'POST' && !isset($seg[2])) {
    requireSuperAdmin();
    $body = getBody();

    if (empty($body['lodgeId']) || empty($body['date'])) {
        jsonError('lodgeId and date are required');
    }

    $lodgeId = (int)$body['lodgeId'];
    $date    = $body['date'];
    $reason  = $body['reason'] ?? '';

    // UPSERT LOGIC (matches Node.js BlockedDate.js findOne + save)
    $existing = $db->fetchOne(
        "SELECT id FROM blocked_dates WHERE lodge_id = ? AND date = ?",
        [$lodgeId, $date]
    );

    if ($existing) {
        $db->query(
            "UPDATE blocked_dates SET reason = ? WHERE id = ?",
            [$reason, $existing['id']]
        );
        $id = $existing['id'];
    } else {
        $db->query(
            "INSERT INTO blocked_dates (lodge_id, date, reason) VALUES (?,?,?)",
            [$lodgeId, $date, $reason]
        );
        $id = $db->lastInsertId();
    }

    $row = $db->fetchOne("SELECT * FROM blocked_dates WHERE id = ?", [$id]);
    jsonResponse($row, $existing ? 200 : 201);
}

// ============================================================== POST bulk
if ($method === 'POST' && ($seg[2] ?? '') === 'bulk') {
    requireSuperAdmin();
    $body  = getBody();
    $dates = $body['dates'] ?? [];

    if (!is_array($dates) || empty($dates)) {
        jsonError('dates array is required');
    }

    $processed = 0;
    foreach ($dates as $entry) {
        if (empty($entry['lodgeId']) || empty($entry['date'])) continue;

        $lId = (int)$entry['lodgeId'];
        $dt  = $entry['date'];
        $re  = $entry['reason'] ?? '';

        $existing = $db->fetchOne(
            "SELECT id FROM blocked_dates WHERE lodge_id = ? AND date = ?",
            [$lId, $dt]
        );

        if ($existing) {
            $db->query("UPDATE blocked_dates SET reason = ? WHERE id = ?", [$re, $existing['id']]);
        } else {
            $db->query("INSERT INTO blocked_dates (lodge_id, date, reason) VALUES (?,?,?)", [$lId, $dt, $re]);
        }
        $processed++;
    }

    jsonResponse(['success' => true, 'processed' => $processed]);
}

// ============================================================== DELETE
if ($method === 'DELETE' && isset($seg[2]) && is_numeric($seg[2])) {
    requireSuperAdmin();
    $id = (int)$seg[2];

    $row = $db->fetchOne("SELECT id FROM blocked_dates WHERE id = ?", [$id]);
    if (!$row) jsonError('Blocked date not found', 404);

    $db->query("DELETE FROM blocked_dates WHERE id = ?", [$id]);
    jsonResponse(['success' => true, 'message' => 'Date unblocked successfully']);
}

jsonError("BlockedDate route not found", 404);
