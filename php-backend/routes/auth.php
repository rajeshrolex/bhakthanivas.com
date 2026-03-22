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
require_once __DIR__ . '/../utils/mail.php';
function generateOTP(int $length = 6): string {
    return str_pad((string)random_int(0, (int)pow(10, $length) - 1), $length, '0', STR_PAD_LEFT);
}
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

// ----------------------------------------------------------- POST /forgot-password
if ($method === 'POST' && $action === 'forgot-password') {
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));

    if (empty($email)) {
        jsonError('Email is required');
    }

    $user = $db->fetchOne("SELECT id, name FROM users WHERE email = ?", [$email]);
    if (!$user) {
        // For security, don't reveal if email exists or not, but for admin panel it's usually okay.
        // Let's be helpful here.
        jsonError('Email not found', 404);
    }

    $otp = generateOTP(6);
    $expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 minutes

    $db->query("DELETE FROM password_resets WHERE email = ?", [$email]);
    $db->query(
        "INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)",
        [$email, $otp, $expiresAt]
    );

    $subject = "Your BhaktaNivas Password Reset OTP";
    $message = "
        <h2>Hello {$user['name']},</h2>
        <p>You requested a password reset for your BhaktaNivas admin account.</p>
        <p>Your 6-digit OTP is: <b style='font-size: 24px; color: #4f46e5;'>{$otp}</b></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
    ";

    if (sendEmail($email, $subject, $message)) {
        jsonResponse(['success' => true, 'message' => 'OTP sent to your email']);
    } else {
        jsonError('Failed to send email. Please contact support.');
    }
}

// ----------------------------------------------------------- POST /verify-otp
if ($method === 'POST' && $action === 'verify-otp') {
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));
    $otp   = trim($body['otp']   ?? '');

    if (empty($email) || empty($otp)) {
        jsonError('Email and OTP are required');
    }

    $reset = $db->fetchOne(
        "SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()",
        [$email, $otp]
    );

    if (!$reset) {
        jsonError('Invalid or expired OTP', 400);
    }

    jsonResponse(['success' => true, 'message' => 'OTP verified successfully']);
}

// ----------------------------------------------------------- POST /reset-password
if ($method === 'POST' && $action === 'reset-password') {
    $body        = getBody();
    $email       = strtolower(trim($body['email'] ?? ''));
    $otp         = trim($body['otp']   ?? '');
    $newPassword = $body['newPassword'] ?? '';

    if (empty($email) || empty($otp) || empty($newPassword)) {
        jsonError('Email, OTP and newPassword are required');
    }

    if (strlen($newPassword) < 6) {
        jsonError('Password must be at least 6 characters');
    }

    $reset = $db->fetchOne(
        "SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW()",
        [$email, $otp]
    );

    if (!$reset) {
        jsonError('Invalid or expired session. Please start over.', 400);
    }

    $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->query("UPDATE users SET password = ? WHERE email = ?", [$hashed, $email]);
    $db->query("DELETE FROM password_resets WHERE email = ?", [$email]);

    jsonResponse(['success' => true, 'message' => 'Password reset successfully. You can now login.']);
}

// Default: Not Found
jsonError("Auth route not found: {$method} /api/auth/{$action}", 404);
