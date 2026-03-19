<?php
/**
 * index.php – Main PHP Router / Front Controller
 *
 * All requests are routed here via Apache .htaccess rewrite.
 * URL pattern: /api/{resource}/{id?}/{sub-action?}
 *
 * Supported routes:
 *   /api/auth/*
 *   /api/lodges/*
 *   /api/rooms/*
 *   /api/bookings/*
 *   /api/daily-prices/*
 *   /api/blocked-dates/*
 *   /api/reviews/*
 *   /api/dashboard/*
 *   /api/users/*
 *   /api/payment/*
 */

declare(strict_types=1);

// ── 1. CORS (must be first) ─────────────────────────────────────────────────
require_once __DIR__ . '/cors.php';

// ── 2. Core Config (loads .env, defines constants, helper functions) ─────────
require_once __DIR__ . '/config.php';

// ── 3. Database ───────────────────────────────────────────────────────────────
require_once __DIR__ . '/database.php';

// ── 4. Auth Middleware ────────────────────────────────────────────────────────
require_once __DIR__ . '/middleware/auth.php';

// ── 5. Route all requests ─────────────────────────────────────────────────────
try {
    $segments = getPathSegments();
    // Expected: segments[0] = 'api', segments[1] = resource
    $resource = $segments[1] ?? '';

    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/routes/auth.php';
            break;

        case 'lodges':
            require_once __DIR__ . '/routes/lodges.php';
            break;

        case 'rooms':
            require_once __DIR__ . '/routes/rooms.php';
            break;

        case 'bookings':
            require_once __DIR__ . '/routes/bookings.php';
            break;

        case 'daily-prices':
            require_once __DIR__ . '/routes/daily_prices.php';
            break;

        case 'blocked-dates':
            require_once __DIR__ . '/routes/blocked_dates.php';
            break;

        case 'reviews':
            require_once __DIR__ . '/routes/reviews.php';
            break;

        case 'dashboard':
            require_once __DIR__ . '/routes/dashboard.php';
            break;

        case 'users':
            require_once __DIR__ . '/routes/users.php';
            break;

        case 'payment':
            require_once __DIR__ . '/routes/payment.php';
            break;

        case '':
        case 'health':
            // Health check endpoint
            jsonResponse([
                'success' => true,
                'service' => 'BhaktaNivas PHP API',
                'version' => '2.0.0',
                'status'  => 'running',
                'time'    => date('c'),
            ]);
            break;

        default:
            jsonError("Unknown API resource: /api/{$resource}", 404);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Database error',
        'message' => $e->getMessage(), // Temporarily show full error
    ]);
    exit;

} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Internal server error',
        'message' => APP_ENV === 'development' ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'An unexpected error occurred',
    ]);
    exit;
}
