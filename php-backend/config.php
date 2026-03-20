<?php
/**
 * config.php – Central configuration loader
 * Loads .env and defines all app constants
 */

declare(strict_types=1);

// Load Composer autoloader
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    echo json_encode(['error' => 'Run: composer install inside php-backend/']);
    exit;
}
require_once $autoload;

// Load .env
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// --- Database ---
define('DB_HOST', $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? $_SERVER['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? 'bhakthanivas');
define('DB_USER', $_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? '');

// --- App ---
$isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1']) || ($_SERVER['HTTP_HOST'] ?? '') === 'localhost';
define('APP_ENV',  $_ENV['APP_ENV']  ?? $_SERVER['APP_ENV']  ?? ($isLocal ? 'development' : 'production'));
define('BASE_URL', rtrim($_ENV['BASE_URL'] ?? $_SERVER['BASE_URL'] ?? 'http://localhost', '/'));

$jwtSecret = $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? '';
if (strlen($jwtSecret) < 32) {
    $jwtSecret = 'bhakthanivas_secret_key_minimum_32_characters_long_secure_2026';
}
define('JWT_SECRET', $jwtSecret);
define('JWT_EXPIRY', (int)($_ENV['JWT_EXPIRY'] ?? $_SERVER['JWT_EXPIRY'] ?? 86400));

// --- Razorpay ---
define('RAZORPAY_KEY_ID',     $_ENV['RAZORPAY_KEY_ID']     ?? $_SERVER['RAZORPAY_KEY_ID']     ?? '');
define('RAZORPAY_KEY_SECRET', $_ENV['RAZORPAY_KEY_SECRET'] ?? $_SERVER['RAZORPAY_KEY_SECRET'] ?? '');

// --- SMTP ---
define('SMTP_HOST',     $_ENV['SMTP_HOST']     ?? $_SERVER['SMTP_HOST']     ?? 'smtp.hostinger.com');
define('SMTP_PORT',     (int)($_ENV['SMTP_PORT'] ?? $_SERVER['SMTP_PORT'] ?? 465));
define('SMTP_EMAIL',    $_ENV['SMTP_EMAIL']    ?? $_SERVER['SMTP_EMAIL']    ?? '');
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? $_SERVER['SMTP_PASSWORD'] ?? '');
define('ADMIN_EMAIL',   $_ENV['ADMIN_EMAIL']   ?? $_SERVER['ADMIN_EMAIL']   ?? '');

// --- Helper: JSON response ---
function jsonResponse(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// --- Helper: JSON error response ---
function jsonError(string $message, int $status = 400): void
{
    jsonResponse(['success' => false, 'error' => $message], $status);
}

// --- Helper: Get parsed JSON body ---
function getBody(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// --- Helper: Get path segments from URI ---
// Parses the request URI and returns path segments starting from 'api'.
// Works regardless of deployment subdirectory (localhost, php-backend/, or Hostinger root).
function getPathSegments(): array
{
    $uri  = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($uri, PHP_URL_PATH) ?? '/';

    // Normalize: remove any script name prefix (e.g. /index.php)
    $path = preg_replace('#/index\.php#', '', $path);
    $path = trim($path, '/');

    $parts = empty($path) ? [] : explode('/', $path);

    // Find the 'api' segment and return from there, so the router always
    // sees ['api', 'resource', ...] regardless of deployment subdirectory.
    $apiIndex = array_search('api', $parts, true);
    if ($apiIndex !== false) {
        return array_values(array_slice($parts, $apiIndex));
    }

    // Fallback: return raw parts (health check on '/' etc.)
    return $parts;
}
