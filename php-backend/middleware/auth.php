<?php
/**
 * middleware/auth.php – JWT Authentication Middleware
 *
 * Functions:
 *   requireAuth()  – Verifies JWT, sets $GLOBALS['authUser']
 *   requireAdmin() – Also checks role === 'super_admin'
 */

declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * Verify Bearer JWT token and set $GLOBALS['authUser'].
 * Returns decoded payload array on success, calls jsonError on failure.
 */
function requireAuth(): array
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        jsonError('No authorization token provided', 401);
    }

    $token = substr($authHeader, 7);

    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        $user    = (array) $decoded;

        // Normalise nested objects from JWT payload
        if (isset($user['data']) && is_object($user['data'])) {
            $user = array_merge($user, (array) $user['data']);
        }

        $GLOBALS['authUser'] = $user;
        return $user;

    } catch (ExpiredException $e) {
        jsonError('Token has expired. Please log in again.', 401);
    } catch (SignatureInvalidException $e) {
        jsonError('Invalid token signature', 401);
    } catch (\Exception $e) {
        jsonError('Invalid or malformed token: ' . $e->getMessage(), 401);
    }

    // Unreachable, but satisfies return type
    return [];
}

/**
 * Same as requireAuth() but additionally checks super_admin role.
 */
function requireSuperAdmin(): array
{
    $user = requireAuth();

    if (($user['role'] ?? '') !== 'super_admin') {
        jsonError('Access denied. Super admin required.', 403);
    }

    return $user;
}

/**
 * Check if authenticated user belongs to lodgeId (or is super_admin).
 */
function requireLodgeAccess(int $lodgeId): array
{
    $user = requireAuth();

    if (($user['role'] ?? '') === 'super_admin') {
        return $user;
    }

    if ((int)($user['lodgeId'] ?? 0) !== $lodgeId) {
        jsonError('Access denied. You do not manage this lodge.', 403);
    }

    return $user;
}
