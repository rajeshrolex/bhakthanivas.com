<?php
/**
 * routes/upload.php – Image Upload Route
 *
 * POST /api/upload          – Upload a single image (admin only)
 * POST /api/upload/multiple – Upload multiple images (admin only)
 */

declare(strict_types=1);

$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$subact = $seg[2] ?? null; // 'multiple' or null

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

$maxFileSize = 5 * 1024 * 1024; // 5 MB (matches Node.js limit)

/**
 * Validate a single file and move it to the uploads directory.
 * Returns relative URL on success, throws RuntimeException on failure.
 */
function processUpload(array $file, array $allowedMimes, int $maxFileSize): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new \RuntimeException('Upload error code: ' . $file['error']);
    }

    if ($file['size'] > $maxFileSize) {
        throw new \RuntimeException('File too large. Maximum size is 5MB');
    }

    // Validate actual MIME via file content (not just extension)
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!array_key_exists($mimeType, $allowedMimes)) {
        throw new \RuntimeException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    $ext = $allowedMimes[$mimeType];

    $uploadDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            throw new \RuntimeException('Could not create upload directory');
        }
    }

    // Unique filename: lodge- + timestamp + random (matches Node.js naming pattern)
    $unique   = time() . '-' . bin2hex(random_bytes(6));
    $filename = "lodge-{$unique}.{$ext}";
    $target   = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        throw new \RuntimeException('Failed to save uploaded file');
    }

    return 'uploads/' . $filename;
}

// ---------------------------------------------------------------- POST /upload/multiple
if ($method === 'POST' && $subact === 'multiple') {
    requireAuth();

    if (empty($_FILES['images']) || !is_array($_FILES['images']['name'])) {
        jsonError('No files uploaded. Use field name "images".');
    }

    $count = count($_FILES['images']['name']);
    if ($count === 0) {
        jsonError('No files uploaded');
    }

    $imageUrls = [];
    $errors    = [];

    for ($i = 0; $i < $count; $i++) {
        $singleFile = [
            'name'     => $_FILES['images']['name'][$i],
            'type'     => $_FILES['images']['type'][$i],
            'tmp_name' => $_FILES['images']['tmp_name'][$i],
            'error'    => $_FILES['images']['error'][$i],
            'size'     => $_FILES['images']['size'][$i],
        ];

        try {
            $imageUrls[] = processUpload($singleFile, $allowedMimes, $maxFileSize);
        } catch (\RuntimeException $e) {
            $errors[] = $_FILES['images']['name'][$i] . ': ' . $e->getMessage();
        }
    }

    if (empty($imageUrls) && !empty($errors)) {
        jsonError('All uploads failed: ' . implode('; ', $errors), 400);
    }

    jsonResponse([
        'success'   => true,
        'message'   => count($imageUrls) . ' image(s) uploaded successfully',
        'imageUrls' => $imageUrls,
        'errors'    => $errors,
    ]);
}

// ---------------------------------------------------------------- POST /upload
if ($method === 'POST' && $subact === null) {
    requireAuth();

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
        jsonError('Upload failed. Error code: ' . $errCode);
    }

    try {
        $url = processUpload($_FILES['image'], $allowedMimes, $maxFileSize);
    } catch (\RuntimeException $e) {
        jsonError($e->getMessage(), 400);
    }

    jsonResponse([
        'success'  => true,
        'message'  => 'Image uploaded successfully',
        'imageUrl' => $url,
        'url'      => $url,
        'filename' => basename($url),
    ]);
}

jsonError("Upload route not found: {$method}", 404);
