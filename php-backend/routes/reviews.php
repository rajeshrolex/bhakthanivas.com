<?php
/**
 * routes/reviews.php – Review Routes
 *
 * GET    /api/reviews?lodgeId= – List reviews for a lodge (public)
 * POST   /api/reviews          – Submit a review (public)
 * DELETE /api/reviews/:id      – Delete a review (admin)
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

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit       = min((int)($_GET['limit'] ?? 50), 200);

    $reviews = $db->fetchAll(
        "SELECT * FROM reviews {$whereClause} ORDER BY created_at DESC LIMIT {$limit}",
        $params
    );

    jsonResponse($reviews);
}

// ============================================================== POST
if ($method === 'POST' && $id === null) {
    $body = getBody();

    $required = ['lodgeId', 'name', 'rating', 'comment'];
    foreach ($required as $f) {
        if (empty($body[$f]) && $body[$f] !== 0) {
            jsonError("Field '{$f}' is required");
        }
    }

    $rating = (int)$body['rating'];
    if ($rating < 1 || $rating > 5) {
        jsonError('Rating must be between 1 and 5');
    }

    $lodgeId = (int)$body['lodgeId'];

    $lodge = $db->fetchOne("SELECT id FROM lodges WHERE id = ?", [$lodgeId]);
    if (!$lodge) jsonError('Lodge not found', 404);

    $db->query(
        "INSERT INTO reviews (lodge_id, name, rating, comment) VALUES (?,?,?,?)",
        [$lodgeId, trim($body['name']), $rating, trim($body['comment'])]
    );

    $newId  = $db->lastInsertId();
    $review = $db->fetchOne("SELECT * FROM reviews WHERE id = ?", [$newId]);

    // Update lodge rating and review count
    $stats = $db->fetchOne(
        "SELECT COUNT(*) AS total, AVG(rating) AS avg_rating FROM reviews WHERE lodge_id = ?",
        [$lodgeId]
    );
    $db->query(
        "UPDATE lodges SET rating = ?, review_count = ? WHERE id = ?",
        [round((float)$stats['avg_rating'], 1), (int)$stats['total'], $lodgeId]
    );

    jsonResponse(['success' => true, 'review' => $review], 201);
}

// ============================================================== DELETE
if ($method === 'DELETE' && $id !== null) {
    requireAuth();

    $review = $db->fetchOne("SELECT * FROM reviews WHERE id = ?", [$id]);
    if (!$review) jsonError('Review not found', 404);

    $lodgeId = (int)$review['lodge_id'];

    $db->query("DELETE FROM reviews WHERE id = ?", [$id]);

    // Recalculate lodge rating
    $stats = $db->fetchOne(
        "SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS avg_rating FROM reviews WHERE lodge_id = ?",
        [$lodgeId]
    );
    $db->query(
        "UPDATE lodges SET rating = ?, review_count = ? WHERE id = ?",
        [round((float)$stats['avg_rating'], 1), (int)$stats['total'], $lodgeId]
    );

    jsonResponse(['success' => true, 'message' => 'Review deleted']);
}

jsonError("Review route not found: {$method}", 404);
