<?php
/**
 * routes/upload.php – Image Upload Route
 *
 * POST /api/upload – Upload an image
 */

declare(strict_types=1);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    requireAuth();

    if (!isset($_FILES['image'])) {
        jsonError('No image file provided');
    }

    $file = $_FILES['image'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!in_array($ext, $allowed, true)) {
        jsonError('Invalid file type. Allowed: ' . implode(', ', $allowed));
    }

    // Ensure uploads directory exists
    $uploadDir = __DIR__ . '/../../uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $target   = $uploadDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        // Return structured response as expected by frontend
        jsonResponse([
            'success' => true,
            'url'     => 'uploads/' . $filename,
            'message' => 'Image uploaded successfully'
        ]);
    } else {
        jsonError('Failed to move uploaded file', 500);
    }
}

jsonError("Upload route not found: {$method}", 404);
