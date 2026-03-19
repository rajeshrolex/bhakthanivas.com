<?php
/**
 * routes/users.php – Admin User Management Routes
 *
 * GET    /api/users       – List admin users (super_admin)
 * GET    /api/users/:id   – Single user
 * POST   /api/users       – Create user (super_admin)
 * PUT    /api/users/:id   – Update user
 * DELETE /api/users/:id   – Delete user (super_admin)
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$id     = isset($seg[2]) && is_numeric($seg[2]) ? (int)$seg[2] : null;

// ============================================================ GET /users
if ($method === 'GET' && $id === null) {
    requireSuperAdmin();

    $users = $db->fetchAll(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users ORDER BY created_at DESC"
    );

    jsonResponse(['success' => true, 'users' => $users]);
}

// ============================================================ GET /users/:id
if ($method === 'GET' && $id !== null) {
    $authUser = requireAuth();

    // Regular admins can only see their own profile
    if (($authUser['role'] ?? '') !== 'super_admin' && (int)$authUser['id'] !== $id) {
        jsonError('Access denied', 403);
    }

    $user = $db->fetchOne(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users WHERE id = ?",
        [$id]
    );

    if (!$user) jsonError('User not found', 404);

    jsonResponse(['success' => true, 'user' => $user]);
}

// ============================================================ POST /users
if ($method === 'POST' && $id === null) {
    requireSuperAdmin();

    $body     = getBody();
    $name     = trim($body['name']     ?? '');
    $email    = strtolower(trim($body['email']    ?? ''));
    $password = $body['password'] ?? '';
    $phone    = trim($body['phone']    ?? '');
    $role     = $body['role']     ?? 'admin';
    $lodgeId  = !empty($body['lodgeId']) ? (int)$body['lodgeId'] : null;

    if (empty($name) || empty($email) || empty($password)) {
        jsonError('name, email and password are required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email format');
    }

    if (!in_array($role, ['super_admin', 'admin'], true)) {
        jsonError('Invalid role');
    }

    if ($db->fetchOne("SELECT id FROM users WHERE email = ?", [$email])) {
        jsonError('Email is already registered', 409);
    }

    $db->query(
        "INSERT INTO users (name, email, password, phone, role, lodge_id) VALUES (?,?,?,?,?,?)",
        [$name, $email, password_hash($password, PASSWORD_BCRYPT), $phone, $role, $lodgeId]
    );

    $user = $db->fetchOne(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users WHERE id = ?",
        [$db->lastInsertId()]
    );

    jsonResponse(['success' => true, 'user' => $user], 201);
}

// ============================================================ PUT /users/:id
if ($method === 'PUT' && $id !== null) {
    $authUser = requireAuth();

    // Admins can only update themselves; super_admin can update anyone
    if (($authUser['role'] ?? '') !== 'super_admin' && (int)$authUser['id'] !== $id) {
        jsonError('Access denied', 403);
    }

    $existing = $db->fetchOne("SELECT * FROM users WHERE id = ?", [$id]);
    if (!$existing) jsonError('User not found', 404);

    $body    = getBody();
    $name    = trim($body['name']  ?? $existing['name']);
    $phone   = trim($body['phone'] ?? $existing['phone']);
    $role    = ($authUser['role'] === 'super_admin') ? ($body['role'] ?? $existing['role']) : $existing['role'];
    $lodgeId = ($authUser['role'] === 'super_admin' && isset($body['lodgeId']))
               ? (empty($body['lodgeId']) ? null : (int)$body['lodgeId'])
               : $existing['lodge_id'];

    $db->query(
        "UPDATE users SET name = ?, phone = ?, role = ?, lodge_id = ? WHERE id = ?",
        [$name, $phone, $role, $lodgeId, $id]
    );

    // Optional password change
    if (!empty($body['newPassword'])) {
        if (strlen($body['newPassword']) < 6) {
            jsonError('New password must be at least 6 characters');
        }
        $db->query(
            "UPDATE users SET password = ? WHERE id = ?",
            [password_hash($body['newPassword'], PASSWORD_BCRYPT), $id]
        );
    }

    $user = $db->fetchOne(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users WHERE id = ?",
        [$id]
    );

    jsonResponse(['success' => true, 'user' => $user]);
}

// ============================================================ DELETE /users/:id
if ($method === 'DELETE' && $id !== null) {
    $authUser = requireSuperAdmin();

    if ((int)$authUser['id'] === $id) {
        jsonError('Cannot delete your own account', 400);
    }

    $user = $db->fetchOne("SELECT id FROM users WHERE id = ?", [$id]);
    if (!$user) jsonError('User not found', 404);

    $db->query("DELETE FROM users WHERE id = ?", [$id]);

    jsonResponse(['success' => true, 'message' => 'User deleted']);
}

jsonError("User route not found: {$method}", 404);
