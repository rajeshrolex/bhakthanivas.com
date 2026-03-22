<?php
/**
 * routes/reviews.php – Review Routes
 *
 * GET    /api/reviews?lodgeId=&slug= – List reviews for a lodge (public)
 * GET    /api/reviews/:slug          – List reviews for a lodge by slug (public)
 * POST   /api/reviews/:slug          – Submit a review for a lodge by slug (public)
 * POST   /api/reviews                – Submit a review with lodgeId (public)
 * DELETE /api/reviews/:id            – Delete a review (admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$idOrSlug = $seg[2] ?? null;

/**
 * Resolve lodge by numeric ID or string slug.
 * Returns lodge row or null.
 */
function getLodgeByIdOrSlug(Database $db, $value): ?array
{
    if ($value === null) return null;
    if (is_numeric($value)) {
        return $db->fetchOne("SELECT id, slug, name FROM lodges WHERE id = ?", [(int)$value]) ?: null;
    }
    return $db->fetchOne("SELECT id, slug, name FROM lodges WHERE slug = ?", [$value]) ?: null;
}

// ============================================================== GET /reviews  or  GET /reviews/:slug
if ($method === 'GET') {
    // Determine lodge from query param or URL slug
    $lodge = null;

    if ($idOrSlug !== null) {
        // GET /api/reviews/:slug-or-id
        $lodge = getLodgeByIdOrSlug($db, $idOrSlug);
        if (!$lodge) jsonError('Lodge not found', 404);
    } elseif (!empty($_GET['lodgeId'])) {
        $lodge = getLodgeByIdOrSlug($db, $_GET['lodgeId']);
    } elseif (!empty($_GET['slug'])) {
        $lodge = getLodgeByIdOrSlug($db, $_GET['slug']);
    }

    $where  = [];
    $params = [];

    if ($lodge) {
        $where[]  = 'lodge_id = ?';
        $params[] = (int)$lodge['id'];
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit       = min((int)($_GET['limit'] ?? 50), 200);

    $reviews = $db->fetchAll(
        "SELECT * FROM reviews {$whereClause} ORDER BY created_at DESC LIMIT {$limit}",
        $params
    );

    // Enrich for frontend compat
    foreach ($reviews as &$r) {
        $r['_id']       = $r['id'];
        $r['createdAt'] = $r['created_at'];
        $r['lodge']     = $lodge ? $lodge['id'] : null;
    }
    unset($r);

    jsonResponse($reviews);
}

// ============================================================== POST /reviews/:slug  or  POST /reviews
if ($method === 'POST' && !is_numeric($idOrSlug)) {
    $body = getBody();

    // Resolve lodge: from URL slug, or from body
    if ($idOrSlug !== null) {
        $lodge = getLodgeByIdOrSlug($db, $idOrSlug);
    } elseif (!empty($body['lodgeId'])) {
        $lodge = getLodgeByIdOrSlug($db, $body['lodgeId']);
    } elseif (!empty($body['slug'])) {
        $lodge = getLodgeByIdOrSlug($db, $body['slug']);
    } else {
        jsonError("lodgeId or lodge slug is required");
    }

    if (!$lodge) jsonError('Lodge not found', 404);

    $name    = trim($body['name']    ?? '');
    $comment = trim($body['comment'] ?? '');
    $rating  = (int)($body['rating'] ?? 0);

    if (empty($name) || empty($comment) || $rating < 1) {
        jsonError('name, rating (1-5) and comment are required');
    }
    if ($rating > 5) {
        jsonError('Rating must be between 1 and 5');
    }

    $db->query(
        "INSERT INTO reviews (lodge_id, name, rating, comment) VALUES (?,?,?,?)",
        [(int)$lodge['id'], $name, $rating, $comment]
    );

    $newId  = $db->lastInsertId();
    $review = $db->fetchOne("SELECT * FROM reviews WHERE id = ?", [$newId]);
    $review['_id']       = $review['id'];
    $review['createdAt'] = $review['created_at'];


    jsonResponse(['success' => true, 'review' => $review], 201);
}

// ============================================================== DELETE /reviews/:id
if ($method === 'DELETE' && $idOrSlug !== null && is_numeric($idOrSlug)) {
    requireAuth();
    $id = (int)$idOrSlug;

    $review = $db->fetchOne("SELECT * FROM reviews WHERE id = ?", [$id]);
    if (!$review) jsonError('Review not found', 404);

    $lodgeId = (int)$review['lodge_id'];

    $db->query("DELETE FROM reviews WHERE id = ?", [$id]);


    jsonResponse(['success' => true, 'message' => 'Review deleted']);
}

jsonError("Review route not found: {$method}", 404);
