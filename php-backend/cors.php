<?php
/**
 * cors.php – CORS Middleware
 * Sets the correct Cross-Origin headers so the React frontend
 * (running on a different port/domain) can communicate with this API.
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
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    // Allow all in dev, restrict in prod via allowedOrigins
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Max-Age: 3600');

// Handle OPTIONS preflight immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
