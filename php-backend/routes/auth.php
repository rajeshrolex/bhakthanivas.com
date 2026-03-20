<?php
/**
 * routes/auth.php – Authentication Routes
 *
 * POST /api/auth/login    – Admin login
 * POST /api/auth/register – Create admin (super_admin only)
 * GET  /api/auth/me       – Return current user from token
 */

declare(strict_types=1);

use Firebase\JWT\JWT;

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
// segments: ['api','auth','login'] etc.
$action = $seg[2] ?? '';

// ------------------------------------------------------------------ GET /me
if ($method === 'GET' && $action === 'me') {
    $user = requireAuth();

    // Re-fetch from DB so data is fresh
    $row = $db->fetchOne(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users WHERE id = ?",
        [$user['id']]
    );

    if (!$row) {
        jsonError('User not found', 404);
    }

    $row['_id']     = $row['id'];
    $row['lodgeId'] = $row['lodge_id'];
    jsonResponse(['success' => true, 'user' => $row]);
}

// --------------------------------------------------------------- POST /login
if ($method === 'POST' && $action === 'login') {
    $body  = getBody();
    $email = trim($body['email'] ?? '');
    $pass  = $body['password'] ?? '';

    if (empty($email) || empty($pass)) {
        jsonError('Email and password are required');
    }

    $user = $db->fetchOne(
        "SELECT * FROM users WHERE email = ?",
        [strtolower($email)]
    );

    if (!$user) {
        jsonError('Invalid email or password', 401);
    }

    $isMatch = false;
    // Check if password looks like a bcrypt hash (starts with $2)
    if (strpos($user['password'], '$2') === 0) {
        $isMatch = password_verify($pass, $user['password']);
    } else {
        $isMatch = ($pass === $user['password']);
    }

    if (!$isMatch) {
        jsonError('Invalid email or password', 401);
    }

    // Build JWT payload
    $now     = time();
    $payload = [
        'iat'     => $now,
        'exp'     => $now + JWT_EXPIRY,
        'id'      => $user['id'],
        'email'   => $user['email'],
        'name'    => $user['name'],
        'role'    => $user['role'],
        'lodgeId' => $user['lodge_id'],
    ];

    $token = JWT::encode($payload, JWT_SECRET, 'HS256');

    unset($user['password']);

    $user['_id']     = $user['id'];
    $user['lodgeId'] = $user['lodge_id'];

    jsonResponse([
        'success' => true,
        'token'   => $token,
        'user'    => $user,
    ]);
}

// ------------------------------------------------------------ POST /register
if ($method === 'POST' && $action === 'register') {
    requireSuperAdmin();

    $body     = getBody();
    $name     = trim($body['name']    ?? '');
    $email    = strtolower(trim($body['email']    ?? ''));
    $password = $body['password'] ?? '';
    $phone    = trim($body['phone']   ?? '');
    $role     = $body['role']     ?? 'admin';
    $lodgeId  = $body['lodgeId']  ?? null;

    if (empty($name) || empty($email) || empty($password)) {
        jsonError('Name, email and password are required');
    }

    if (!in_array($role, ['super_admin', 'admin'], true)) {
        jsonError('Invalid role. Must be super_admin or admin');
    }

    // Check duplicate
    $existing = $db->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
    if ($existing) {
        jsonError('Email is already registered', 409);
    }

    $hashed = password_hash($password, PASSWORD_BCRYPT);

    $db->query(
        "INSERT INTO users (name, email, password, phone, role, lodge_id) VALUES (?, ?, ?, ?, ?, ?)",
        [$name, $email, $hashed, $phone, $role, $lodgeId]
    );

    $newId = $db->lastInsertId();
    $user  = $db->fetchOne(
        "SELECT id, name, email, phone, role, lodge_id, created_at FROM users WHERE id = ?",
        [$newId]
    );

    $user['_id']     = $user['id'];
    $user['lodgeId'] = $user['lodge_id'];
    jsonResponse(['success' => true, 'user' => $user], 201);
}

// ----------------------------------------------------------- POST /change-password
if ($method === 'POST' && $action === 'change-password') {
    $authUser    = requireAuth();
    $body        = getBody();
    $oldPassword = $body['oldPassword'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if (empty($oldPassword) || empty($newPassword)) {
        jsonError('oldPassword and newPassword are required');
    }

    if (strlen($newPassword) < 6) {
        jsonError('New password must be at least 6 characters');
    }

    $user = $db->fetchOne("SELECT * FROM users WHERE id = ?", [$authUser['id']]);

    if (!$user || !password_verify($oldPassword, $user['password'])) {
        jsonError('Current password is incorrect', 401);
    }

    $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->query("UPDATE users SET password = ? WHERE id = ?", [$hashed, $authUser['id']]);

    jsonResponse(['success' => true, 'message' => 'Password updated successfully']);
}

// Default: Not Found
jsonError("Auth route not found: {$method} /api/auth/{$action}", 404);
