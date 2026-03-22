<?php
/**
 * utils/mail.php – Email Helper
 */

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

/**
 * Sends an email using PHPMailer and SMTP settings from config.php
 */
function sendEmail(string $to, string $subject, string $body, bool $isHtml = true): bool
{
    $mail = new PHPMailer(true);

    try {
        // Server settings
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;         // Enable verbose debug output
        $mail->isSMTP();                                  // Send using SMTP
        $mail->Host       = SMTP_HOST;                    // Set the SMTP server to send through
        $mail->SMTPAuth   = true;                         // Enable SMTP authentication
        $mail->Username   = SMTP_EMAIL;                   // SMTP username
        $mail->Password   = SMTP_PASSWORD;                // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // Enable implicit TLS encryption
        $mail->Port       = SMTP_PORT;                    // TCP port to connect to

        // Recipients
        $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas Admin');
        $mail->addAddress($to);

        // Content
        $mail->isHTML($isHtml);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Mail Error: {$mail->ErrorInfo}");
        return false;
    }
}
