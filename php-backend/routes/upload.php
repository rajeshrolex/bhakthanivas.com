<?php
/**
 * routes/upload.php – Image Upload Route
 *
 * POST /api/upload – Upload an image (admin only)
 */

declare(strict_types=1);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    requireAuth();

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
        jsonError('Upload failed. Error code: ' . $errCode);
    }

    $file = $_FILES['image'];

    // BUG FIX: Only checking extension is not secure—attackers can rename files.
    // Also validate the actual MIME type using finfo to verify file content.
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    if (!array_key_exists($mimeType, $allowedMimes)) {
        jsonError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Use the MIME-derived extension to avoid extension spoofing
    $ext = $allowedMimes[$mimeType];

    // BUG FIX: __DIR__ is inside php-backend/routes/, so ../../uploads resolves
    // two levels up from routes/—to the project root, not the deployment webroot.
    // Use a path relative to the backend root instead.
    $uploadDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            jsonError('Could not create upload directory', 500);
        }
    }

    // Unique filename using time + random bytes to avoid collisions
    $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $target   = $uploadDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        jsonResponse([
            'success' => true,
            // Return a relative URL the frontend can resolve via getImageUrl()
            'url'     => 'uploads/' . $filename,
            'message' => 'Image uploaded successfully',
        ]);
    } else {
        jsonError('Failed to save uploaded file', 500);
    }
}

jsonError("Upload route not found: {$method}", 404);
