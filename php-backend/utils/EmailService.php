<?php
/**
 * utils/EmailService.php – PHPMailer Email Service
 *
 * Mirrors the Node.js emailService.js exactly (same HTML templates).
 *
 * Usage:
 *   $service = new EmailService();
 *   $service->sendBookingEmails($bookingDetails);
 */

declare(strict_types=1);

require_once __DIR__ . '/TimeUtils.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

class EmailService
{
    private function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_EMAIL;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        return $mail;
    }

    private function formatTo12Hour(string $time): string
    {
        if (empty($time)) return '12:00 PM';

        $parts  = explode(':', $time);
        $hour   = (int)$parts[0];
        $minute = $parts[1] ?? '00';
        $ampm   = $hour >= 12 ? 'PM' : 'AM';
        $hour12 = $hour % 12 ?: 12;

        return sprintf('%d:%s %s', $hour12, $minute, $ampm);
    }

    /**
     * Send booking confirmation email to the guest.
     */
    public function sendGuestConfirmation(array $d): bool
    {
        try {
            $mail = $this->createMailer();

            $totalAmount   = $d['amount']        ?? 0;
            $amountPaid    = $d['amountPaid']    ?? 0;
            $balanceAmount = $d['balanceAmount'] ?? 0;
            $isFullyPaid   = $amountPaid == $totalAmount && $balanceAmount == 0;

            $paymentSection = "
                <tr>
                    <td style=\"padding:8px 0;color:#6b7280;\">Total Amount:</td>
                    <td style=\"padding:8px 0;font-weight:bold;color:#1f2937;\">₹{$totalAmount}</td>
                </tr>";

            if ($amountPaid > 0) {
                $paymentSection .= "
                <tr>
                    <td style=\"padding:8px 0;color:#6b7280;\">Paid Online:</td>
                    <td style=\"padding:8px 0;font-weight:bold;color:#16a34a;\">₹{$amountPaid} ✅</td>
                </tr>";
            }
            if ($balanceAmount > 0) {
                $paymentSection .= "
                <tr>
                    <td style=\"padding:8px 0;color:#6b7280;\">Balance Due at Lodge:</td>
                    <td style=\"padding:8px 0;font-weight:bold;color:#dc2626;\">₹{$balanceAmount} 💰</td>
                </tr>";
            }
            if ($isFullyPaid) {
                $paymentSection .= "
                <tr>
                    <td style=\"padding:8px 0;color:#6b7280;\">Payment Status:</td>
                    <td style=\"padding:8px 0;font-weight:bold;color:#16a34a;\">✅ FULLY PAID</td>
                </tr>";
            } else {
                $paymentSection .= "
                <tr>
                    <td style=\"padding:8px 0;color:#6b7280;\">Payment Status:</td>
                    <td style=\"padding:8px 0;font-weight:bold;color:#f59e0b;\">⏳ PENDING</td>
                </tr>";
            }

            $paymentReminder = $balanceAmount > 0
                ? "<div style=\"background:#fef3c7;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;\">
                       <p style=\"margin:0;color:#92400e;font-size:14px;\">
                           <strong>💰 Balance Payment Required at Check-in:</strong><br>
                           Please pay remaining <strong>₹{$balanceAmount}</strong> via Cash or UPI at the lodge during check-in.
                       </p>
                   </div>"
                : '';

            $checkInFmt  = $this->formatTo12Hour($d['checkInTime'] ?? '12:00');
            $checkOutFmt = $d['checkOutTime'] ?? '11:00 AM';
            $lodgeName   = htmlspecialchars($d['lodgeName'] ?? '');
            $guestName   = htmlspecialchars($d['guestName'] ?? '');
            $roomName    = htmlspecialchars($d['roomName']  ?? '');
            $bookingId   = htmlspecialchars($d['bookingId'] ?? '');
            $baseUrl     = rtrim($d['baseUrl'] ?? BASE_URL, '/');
            $terms       = htmlspecialchars($d['terms'] ?? 'Standard terms and conditions apply.');

            $subject = $balanceAmount > 0
                ? "🙏 Booking Reserved (Balance ₹{$balanceAmount} Due) - {$lodgeName}"
                : "🙏 Booking Confirmed - {$lodgeName}";

            $html = "
<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\">
    <div style=\"background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:10px 10px 0 0\">
        <h1 style=\"color:white;margin:0;text-align:center\">🙏 " . ($isFullyPaid ? 'Booking Confirmed!' : 'Booking Reserved!') . "</h1>
    </div>
    <div style=\"background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
        <p style=\"font-size:16px;color:#374151\">Dear <strong>{$guestName}</strong>,</p>
        <p style=\"color:#6b7280\">Your booking at <strong>{$lodgeName}</strong> has been " . ($isFullyPaid ? 'confirmed' : 'reserved') . ".</p>
        {$paymentReminder}
        <div style=\"background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0\">
            <h3 style=\"margin:0 0 15px 0;color:#1f2937\">Booking Details</h3>
            <table style=\"width:100%;border-collapse:collapse\">
                <tr><td style=\"padding:8px 0;color:#6b7280\">Booking ID:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$bookingId}</td></tr>
                <tr><td style=\"padding:8px 0;color:#6b7280\">Stay:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">" . ($d['rooms'] ?? 1) . " " . (($d['rooms'] ?? 1) == 1 ? 'Room' : 'Rooms') . " | " . ($d['nights'] ?? 1) . " " . (($d['nights'] ?? 1) == 1 ? 'Night' : 'Nights') . "</td></tr>
                <tr><td style=\"padding:8px 0;color:#6b7280\">Room Type:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$roomName}</td></tr>
                <tr><td style=\"padding:8px 0;color:#6b7280\">Check-in:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['checkIn']} at {$checkInFmt}</td></tr>
                <tr><td style=\"padding:8px 0;color:#6b7280\">Check-out:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['checkOut']} at {$checkOutFmt}</td></tr>
                <tr><td style=\"padding:8px 0;color:#6b7280\">Guests:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['guests']}</td></tr>
                {$paymentSection}
            </table>
        </div>
        <div style=\"background:#fef3c7;padding:15px;border-radius:8px;margin:20px 0\">
            <p style=\"margin:0;color:#92400e;font-size:14px\">
                <strong>📍 Check-in Time:</strong> {$checkInFmt} | <strong>Check-out Time:</strong> {$checkOutFmt}<br>
                Please carry a valid ID proof (Aadhar/Passport/DL).
            </p>
        </div>
        <div style=\"text-align:center;margin:30px 0\">
            <a href=\"{$baseUrl}/api/bookings/{$bookingId}/invoice\"
               style=\"background:#2563eb;color:white;padding:12px 25px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block\">
                📄 Download Invoice PDF
            </a>
        </div>
        <div style=\"background:#f9fafb;padding:15px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb\">
            <h4 style=\"margin:0 0 10px 0;color:#374151;font-size:14px\">📜 Terms &amp; Conditions</h4>
            <div style=\"color:#6b7280;font-size:12px;line-height:1.5;white-space:pre-wrap\">{$terms}</div>
        </div>
        <p style=\"color:#f97316;font-size:16px;text-align:center;margin-top:30px\">🙏 Wishing you a blessed spiritual journey! 🙏</p>
    </div>
</div>";

            $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas');
            $mail->addAddress($d['email']);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body    = $html;

            $mail->send();
            return true;

        } catch (MailException $e) {
            error_log('Guest email error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send new booking notification to lodge admin.
     */
    public function sendAdminNotification(array $d): bool
    {
        try {
            $mail = $this->createMailer();

            $adminEmail    = $d['lodgeAdminEmail'] ?? ADMIN_EMAIL;
            $totalAmount   = $d['amount']        ?? 0;
            $amountPaid    = $d['amountPaid']    ?? 0;
            $balanceAmount = $d['balanceAmount'] ?? 0;
            $isFullyPaid   = $amountPaid == $totalAmount && $balanceAmount == 0;
            $isPayAtLodge  = $amountPaid == 0 && $balanceAmount == $totalAmount;

            $bgColor   = $isFullyPaid ? '#f0fdf4' : '#fef3c7';
            $txtColor  = $isFullyPaid ? '#16a34a' : '#92400e';
            $bordColor = $isFullyPaid ? '#16a34a' : '#f59e0b';
            $icon      = $isFullyPaid ? '✅' : '⏳';

            $paymentBlock = "
<div style=\"background:{$bgColor};padding:15px;border-radius:8px;margin-bottom:20px;border-left:4px solid {$bordColor}\">
    <p style=\"margin:0;color:{$txtColor};font-weight:bold;font-size:18px\">{$icon} Total Amount: ₹{$totalAmount}</p>" .
            ($amountPaid > 0 ? "<p style=\"margin:5px 0 0 0;color:#16a34a;font-size:16px\">✅ Paid Online: ₹{$amountPaid}</p>" : '') .
            ($balanceAmount > 0 ? "<p style=\"margin:5px 0 0 0;color:#dc2626;font-weight:bold;font-size:16px\">💰 Balance to Collect: ₹{$balanceAmount}</p>" : '') .
            "</div>";

            $checkInFmt  = $this->formatTo12Hour($d['checkInTime'] ?? '12:00');
            $checkOutFmt = $d['checkOutTime'] ?? '11:00 AM';
            $lodgeName   = htmlspecialchars($d['lodgeName']  ?? '');
            $guestName   = htmlspecialchars($d['guestName']  ?? '');
            $guestPhone  = htmlspecialchars($d['phone']      ?? '');
            $guestEmail  = htmlspecialchars($d['email']      ?? 'N/A');
            $roomName    = htmlspecialchars($d['roomName']   ?? '');
            $bookingId   = htmlspecialchars($d['bookingId']  ?? '');
            $payMethod   = $isPayAtLodge ? 'Pay at Lodge (Cash/UPI)' : 'Online (UPI)';
            $paymentId   = htmlspecialchars($d['paymentId'] ?? 'N/A');
            $termsSnip   = htmlspecialchars(mb_substr($d['terms'] ?? 'Standard terms applied.', 0, 150)) . '...';

            $subject = $balanceAmount > 0
                ? "🔔 New Booking (Balance ₹{$balanceAmount} to Collect) - {$lodgeName}"
                : "🔔 New Booking (Fully Paid) - {$lodgeName}";

            $html = "
<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\">
    <div style=\"background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:20px;border-radius:10px 10px 0 0\">
        <h1 style=\"color:white;margin:0;text-align:center\">🔔 New Booking Received!</h1>
    </div>
    <div style=\"background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
        {$paymentBlock}
        <h3 style=\"color:#1f2937;margin-bottom:15px\">Guest Information</h3>
        <table style=\"width:100%;border-collapse:collapse;margin-bottom:20px\">
            <tr><td style=\"padding:8px 0;color:#6b7280\">Name:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$guestName}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Phone:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$guestPhone}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Email:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$guestEmail}</td></tr>
        </table>
        <h3 style=\"color:#1f2937;margin-bottom:15px\">Booking Details</h3>
        <table style=\"width:100%;border-collapse:collapse\">
            <tr><td style=\"padding:8px 0;color:#6b7280\">Booking ID:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$bookingId}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Lodge:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$lodgeName}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Stay:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">" . ($d['rooms'] ?? 1) . " " . (($d['rooms'] ?? 1) == 1 ? 'Room' : 'Rooms') . " | " . ($d['nights'] ?? 1) . " " . (($d['nights'] ?? 1) == 1 ? 'Night' : 'Nights') . "</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Room Type:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$roomName}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Check-in:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['checkIn']} at {$checkInFmt}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Check-out:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['checkOut']} at {$checkOutFmt}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Guests:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$d['guests']}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Payment Method:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$payMethod}</td></tr>
            <tr><td style=\"padding:8px 0;color:#6b7280\">Payment ID:</td><td style=\"padding:8px 0;font-weight:bold;color:#1f2937\">{$paymentId}</td></tr>
        </table>
        <div style=\"background:#f8fafc;padding:10px;border-radius:5px;margin-top:15px\">
            <p style=\"margin:0;font-size:12px;color:#64748b\"><strong>Terms agreed by guest:</strong><br>{$termsSnip}</p>
        </div>
        <p style=\"color:#6b7280;font-size:14px;margin-top:30px;text-align:center\">
            This is an automated notification from BhaktaNivas Booking System
        </p>
    </div>
</div>";

            $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas System');
            $mail->addAddress($adminEmail);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body    = $html;

            $mail->send();
            return true;

        } catch (MailException $e) {
            error_log('Admin email error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send OTP email for password reset.
     */
    public function sendOTP(string $to, string $guestName, string $otp): bool
    {
        try {
            $mail = $this->createMailer();

            $subject = "Your BhaktaNivas Password Reset OTP";
            $html = "
<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px\">
    <div style=\"background:linear-gradient(135deg,#4f46e5,#4338ca);padding:20px;border-radius:10px 10px 0 0\">
        <h1 style=\"color:white;margin:0;text-align:center\">🔐 Password Recovery</h1>
    </div>
    <div style=\"background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px\">
        <p style=\"font-size:16px;color:#374151\">Hello <strong>" . htmlspecialchars($guestName) . "</strong>,</p>
        <p style=\"color:#6b7280\">You requested a password reset for your BhaktaNivas admin account.</p>
        
        <div style=\"background:#f3f4f6;padding:30px;border-radius:12px;margin:25px 0;text-align:center\">
            <p style=\"margin:0 0 10px 0;color:#6b7280;font-size:14px;text-transform:uppercase;letter-spacing:1px\">Your 6-Digit Verification Code</p>
            <h2 style=\"margin:0;color:#4f46e5;font-size:42px;letter-spacing:8px;font-family:monospace\">{$otp}</h2>
        </div>
        
        <div style=\"background:#fef2f2;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444\">
            <p style=\"margin:0;color:#991b1b;font-size:13px\">
                <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. 
                If you did not request this, please ignore this email or contact the super admin.
            </p>
        </div>
        
        <p style=\"color:#6b7280;font-size:14px;margin-top:30px;text-align:center\">
            Sent with 🙏 by BhaktaNivas Management System
        </p>
    </div>
</div>";

            $mail->setFrom(SMTP_EMAIL, 'BhaktaNivas System');
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body    = $html;

            $mail->send();
            return true;
        } catch (MailException $e) {
            error_log('OTP email error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send both guest confirmation and admin notification.
     */
    public function sendBookingEmails(array $bookingDetails): array
    {
        $guestSent = false;
        $adminSent = false;

        if (!empty($bookingDetails['email'])) {
            $guestSent = $this->sendGuestConfirmation($bookingDetails);
        }

        $adminSent = $this->sendAdminNotification($bookingDetails);

        return [
            'guestEmailSent' => $guestSent,
            'adminEmailSent' => $adminSent,
        ];
    }
}
