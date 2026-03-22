<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

try {
    $db = Database::getInstance();
    
    // Fetch all lodges
    $lodges = $db->fetchAll("SELECT id, images FROM lodges");
    
    $updatedCount = 0;
    
    foreach ($lodges as $lodge) {
        if ($lodge['images']) {
            $imagesArray = json_decode($lodge['images'], true);
            $needsUpdate = false;
            
            if (is_array($imagesArray)) {
                foreach ($imagesArray as &$img) {
                    if (strpos($img, 'via.placeholder.com') !== false) {
                        $img = str_replace('via.placeholder.com', 'placehold.co', $img);
                        $needsUpdate = true;
                    }
                }
                
                if ($needsUpdate) {
                    $newImagesJson = json_encode($imagesArray);
                    $db->query("UPDATE lodges SET images = ? WHERE id = ?", [$newImagesJson, $lodge['id']]);
                    $updatedCount++;
                    echo "Updated lodge ID: " . $lodge['id'] . "\n";
                }
            }
        }
    }
    
    echo "Done! Updated $updatedCount lodges.\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
