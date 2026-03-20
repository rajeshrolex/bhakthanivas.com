<?php
/**
 * utils/WhatsappService.php – WhatsApp Notification Service
 *
 * Mirrors Node.js whatsappService.js behavior exactly.
 * Logs the WhatsApp message and provides a click-to-chat link.
 * Extend with Twilio/Interakt/Meta Cloud API as needed.
 *
 * Usage:
 *   $svc = new WhatsappService();
 *   $svc->sendBookingNotification($bookingDetails);
 */

declare(strict_types=1);

class WhatsappService
{
    /**
     * Send a booking confirmation notification via WhatsApp.
     *
     * @param array $details {
     *   guestName    string
     *   phone        string  (raw, with or without country code)
     *   bookingId    string
     *   lodgeName    string
     *   amountPaid   float
     *   balanceAmount float
     * }
     * @return bool
     */
    public function sendBookingNotification(array $details): bool
    {
        try {
            $guestName     = $details['guestName']     ?? '';
            $phone         = $details['phone']         ?? '';
            $bookingId     = $details['bookingId']     ?? '';
            $lodgeName     = $details['lodgeName']     ?? '';
            $amountPaid    = $details['amountPaid']    ?? 0;
            $balanceAmount = $details['balanceAmount'] ?? 0;

            // Clean phone number (remove non-digits)
            $cleanPhone  = preg_replace('/\D/', '', $phone);
            // Prepend India country code if 10 digits (no code yet)
            $targetPhone = (strlen($cleanPhone) === 10)
                ? '91' . $cleanPhone
                : $cleanPhone;

            $message = "🙏 Namaste {$guestName}!\n\n"
                . "Your booking at *{$lodgeName}* is confirmed.\n"
                . "Booking ID: {$bookingId}\n"
                . "Amount Paid: ₹{$amountPaid}\n"
                . "Balance: ₹{$balanceAmount}\n\n"
                . "Wishing you a blessed journey! 🙏";

            // Log the notification (same as Node.js console.log)
            $waLink = 'https://wa.me/' . $targetPhone . '?text=' . urlencode($message);

            error_log("[WHATSAPP NOTIFICATION] To: {$targetPhone}");
            error_log("Message: {$message}");
            error_log("Manual WhatsApp Link: {$waLink}");

            return true;

        } catch (\Throwable $e) {
            error_log('WhatsApp notification error: ' . $e->getMessage());
            return false;
        }
    }
}
