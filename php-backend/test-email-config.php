<?php
/**
 * test-email-config.php – SMTP Email Configuration Test
 *
 * Run from command line: php test-email-config.php
 * Sends a test email to ADMIN_EMAIL using PHPMailer.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

echo "📧 BhaktaNivas – SMTP Email Configuration Test\n";
echo "──────────────────────────────────────────────\n\n";

echo "  SMTP Host     : " . SMTP_HOST     . "\n";
echo "  SMTP Port     : " . SMTP_PORT     . "\n";
echo "  SMTP Email    : " . SMTP_EMAIL    . "\n";
echo "  SMTP Password : " . (SMTP_PASSWORD ? '(set)' : '(NOT SET)') . "\n";
echo "  Admin Email   : " . ADMIN_EMAIL   . "\n\n";

try {
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_EMAIL;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // Enable SMTP debug output
    $mail->SMTPDebug  = 0; // Set to 2 for verbose debug output

    $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas Test');
    $mail->addAddress(ADMIN_EMAIL, 'Admin');

    $mail->isHTML(true);
    $mail->Subject = '✅ BhaktaNivas – SMTP Test Successful';
    $mail->Body    = '
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:10px 10px 0 0">
                <h2 style="color:white;margin:0;text-align:center">🙏 BhaktaNivas Email Test</h2>
            </div>
            <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
                <p style="color:#374151;font-size:16px">✅ Your SMTP configuration is working correctly!</p>
                <table style="width:100%;font-size:14px">
                    <tr><td style="color:#6b7280;padding:6px 0">Host:</td><td><strong>' . SMTP_HOST . '</strong></td></tr>
                    <tr><td style="color:#6b7280;padding:6px 0">Port:</td><td><strong>' . SMTP_PORT . '</strong></td></tr>
                    <tr><td style="color:#6b7280;padding:6px 0">Sender:</td><td><strong>' . SMTP_EMAIL . '</strong></td></tr>
                    <tr><td style="color:#6b7280;padding:6px 0">Time:</td><td><strong>' . date('Y-m-d H:i:s T') . '</strong></td></tr>
                </table>
                <p style="color:#f97316;text-align:center;margin-top:20px">🙏 BhaktaNivas PHP Backend v2.0</p>
            </div>
        </div>
    ';
    $mail->AltBody = 'BhaktaNivas SMTP test email – configuration is working.';

    $mail->send();

    echo "  ✅  Email sent successfully to: " . ADMIN_EMAIL . "\n";
    echo "\n✅  Email test PASSED\n\n";

} catch (MailException $e) {
    echo "  ❌  Email FAILED to send!\n\n";
    echo "  PHPMailer Error: " . $e->getMessage() . "\n\n";
    echo "  Troubleshooting tips:\n";
    echo "  1. Verify SMTP_HOST / SMTP_PORT / SMTP_PASSWORD in .env\n";
    echo "  2. Ensure port 465 is not blocked by firewall\n";
    echo "  3. Check if the SMTP account allows app passwords\n";
    echo "  4. Try setting SMTP_PORT=587 with ENCRYPTION_STARTTLS\n\n";
    exit(1);
}
