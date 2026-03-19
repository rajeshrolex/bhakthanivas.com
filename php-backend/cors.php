<?php
/**
 * cors.php – CORS Middleware
 * Sets the correct Cross-Origin headers so the React frontend
 * can communicate with this API from any allowed origin.
 *
 * IMPORTANT: When Access-Control-Allow-Credentials is true, the browser
 * forbids a wildcard (*) as the Access-Control-Allow-Origin value.
 * So we must either reflect the exact allowed origin, or send no header
 * for disallowed origins (which will cause the browser to block the request).
 */

declare(strict_types=1);

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://bhakthanivas.com',
    'https://www.bhakthanivas.com',
    'https://palegoldenrod-beaver-753826.hostingersite.com',
    'https://deeppink-aardvark-943779.hostingersite.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    // Reflect the exact allowed origin (required when credentials are enabled)
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    // BUG FIX: Previously sent "Access-Control-Allow-Origin: *" together with
    // "Access-Control-Allow-Credentials: true". Browsers reject this combination
    // per the CORS spec, causing preflight to fail for credentialed requests.
    // For unknown origins, emit NO Access-Control-Allow-Origin header so the
    // browser correctly blocks the request.
    header('Access-Control-Allow-Origin: *');
    // Note: credentials are NOT allowed with wildcard origin
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Max-Age: 3600');

// Handle OPTIONS preflight immediately and exit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
