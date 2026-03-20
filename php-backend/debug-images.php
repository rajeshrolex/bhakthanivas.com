<?php
/**
 * debug-images.php – Image Path Debugger
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

echo "🖼️ BhaktaNivas – Image Path Debugger\n";
echo "====================================\n\n";

$uploadDir = __DIR__ . '/uploads';
echo "🔍 Checking Directory: $uploadDir\n";

if (is_dir($uploadDir)) {
    echo "✅ Directory exists.\n";
    echo "📄 Permissions: " . substr(sprintf('%o', fileperms($uploadDir)), -4) . "\n";
    
    $files = scandir($uploadDir);
    $count = count($files) - 2; // Subtract . and ..
    echo "📁 Files count: $count\n\n";
    
    if ($count > 0) {
        echo "Last 5 files:\n";
        $i = 0;
        foreach (array_reverse($files) as $file) {
            if ($file !== '.' && $file !== '..') {
                echo " - $file\n";
                if (++$i >= 5) break;
            }
        }
    } else {
        echo "⚠️ Directory is empty.\n";
    }
} else {
    echo "❌ Directory DOES NOT EXIST.\n";
    echo "Parent directory info: " . __DIR__ . "\n";
}

echo "\n🔗 Suggested Image URLs (based on current request):\n";
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$requestUri = $_SERVER['REQUEST_URI'];
$apiPath = str_replace('/debug-images.php', '', $requestUri);

echo " - Base API Path: $apiPath\n";
echo " - Example Image: $baseUrl$apiPath/uploads/example.jpg\n";
