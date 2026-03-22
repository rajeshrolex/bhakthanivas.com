<?php
/**
 * debug_auth.php – Comprehensive diagnostic for DB and Mail
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/utils/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

echo "<h1>BhaktaNivas Auth Diagnostics</h1>";

// 1. Check Database
try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();
    
    echo "<h3>1. Database Connectivity</h3>";
    echo "<p style='color:green;'>✅ Connected to database: " . DB_NAME . "</p>";

    // Ensure table exists
    $sql = "
        CREATE TABLE IF NOT EXISTS password_resets (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email      VARCHAR(255) NOT NULL,
            otp        VARCHAR(10)  NOT NULL,
            expires_at DATETIME     NOT NULL,
            created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_otp   (otp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $pdo->exec($sql);
    echo "<p style='color:green;'>✅ Table 'password_resets' checked/created.</p>";

} catch (\Throwable $e) {
    echo "<p style='color:red;'>❌ Database Error: " . $e->getMessage() . "</p>";
}

// 2. Check Mail
echo "<h3>2. Email Configuration</h3>";
echo "<ul>";
echo "<li>SMTP Host: " . SMTP_HOST . "</li>";
echo "<li>SMTP Port: " . SMTP_PORT . "</li>";
echo "<li>SMTP User: " . SMTP_EMAIL . "</li>";
echo "<li>SMTP Pass: " . (empty(SMTP_PASSWORD) ? "MISSING" : "SET (ends with " . substr(SMTP_PASSWORD, -4) . ")") . "</li>";
echo "</ul>";

if (isset($_GET['test_email'])) {
    $to = $_GET['test_email'];
    echo "<h4>Attempting to send test email to: " . htmlspecialchars($to) . "</h4>";
    
    $mail = new PHPMailer(true);
    try {
        $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        $mail->Debugoutput = function($str, $level) {
            echo "<pre style='font-size:11px; color:#666;'>$str</pre>";
        };
        
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_EMAIL;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = (SMTP_PORT === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;

        $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas Test');
        $mail->addAddress($to);
        $mail->Subject = "SMTP Test - " . date('Y-m-d H:i:s');
        $mail->Body    = "This is a test email from BhaktaNivas diagnostics.";

        if ($mail->send()) {
            echo "<h2 style='color:green;'>✅ Email Sent Successfully!</h2>";
        }
    } catch (\Exception $e) {
        echo "<h2 style='color:red;'>❌ Email Failed!</h2>";
        echo "<p>Error: " . $mail->ErrorInfo . "</p>";
    }
} else {
    echo "<p><a href='?test_email=" . SMTP_EMAIL . "'>Click here to test SMTP sending to " . SMTP_EMAIL . "</a></p>";
}

echo "<hr><p><strong>Note:</strong> Please delete this file after testing.</p>";
