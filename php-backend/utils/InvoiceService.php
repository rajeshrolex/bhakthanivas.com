<?php
/**
 * utils/InvoiceService.php – PDF Invoice Generator
 *
 * Mirrors Node.js invoiceService.js (pdfkit) behavior using Dompdf.
 * Generates a PDF buffer matching the same layout and content.
 *
 * Usage:
 *   require_once __DIR__ . '/InvoiceService.php';
 *   $pdf = InvoiceService::generate($bookingDetails);
 *   // $pdf is the raw PDF content as a string
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

class InvoiceService
{
    /**
     * Generate a PDF invoice buffer for a booking.
     *
     * @param  array  $d  Booking details array
     * @return string     Raw PDF binary string
     */
    public static function generate(array $d): string
    {
        $bookingId     = htmlspecialchars($d['bookingId']     ?? '');
        $bookingDate   = htmlspecialchars($d['bookingDate']   ?? '');
        $guestName     = htmlspecialchars($d['guestName']     ?? '');
        $phone         = htmlspecialchars($d['phone']         ?? '');
        $lodgeName     = htmlspecialchars($d['lodgeName']     ?? '');
        $roomType      = htmlspecialchars($d['roomType']      ?? '');
        $roomName      = htmlspecialchars($d['roomName']      ?? '');
        $checkIn       = htmlspecialchars($d['checkIn']       ?? '');
        $checkOut      = htmlspecialchars($d['checkOut']      ?? '');
        $checkInTime   = htmlspecialchars($d['checkInTime']   ?? '12:00 PM');
        $checkOutTime  = htmlspecialchars($d['checkOutTime']  ?? '11:00 AM');
        $guests        = (int)($d['guests']       ?? 1);
        $rooms         = (int)($d['rooms']        ?? 1);
        $amount        = number_format((float)($d['amount']       ?? 0), 2);
        $amountPaid    = number_format((float)($d['amountPaid']   ?? 0), 2);
        $balanceAmount = number_format((float)($d['balanceAmount'] ?? 0), 2);
        $paymentMode   = (($d['paymentMethod'] ?? '') === 'online') ? 'Online (Razorpay)' : 'Pay At Lodge';
        $paymentId     = htmlspecialchars($d['paymentId']     ?? 'N/A');
        $paymentStatus = strtoupper(htmlspecialchars($d['paymentStatus'] ?? 'pending'));

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body      { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #111; margin: 0; padding: 20px; }
  .header   { text-align: center; margin-bottom: 20px; }
  .header h1{ font-size: 18pt; margin: 0; }
  .header p { margin: 2px 0; font-size: 10pt; color: #555; }
  h2        { font-size: 14pt; margin-bottom: 8px; }
  table     { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table td  { border: 1px solid #999; padding: 5px 8px; vertical-align: top; }
  table td:first-child { width: 40%; background: #f5f5f5; font-weight: bold; }
  .fin-header td { background: #e0e0e0; font-weight: bold; text-align: center; }
  .fin-total td  { font-weight: bold; }
  .notes    { font-size: 9pt; color: #555; margin-top: 10px; }
  .footer   { text-align: center; margin-top: 30px; font-size: 9pt; color: #777; }
</style>
</head>
<body>
<div class="header">
  <h1>BhaktaNivas</h1>
  <p>Trusted stays for devotees</p>
  <p>Mantralayam</p>
</div>

<h2>Booking Invoice</h2>

<table>
  <tr><td>Invoice No</td><td>{$bookingId}</td></tr>
  <tr><td>Booking Date</td><td>{$bookingDate}</td></tr>
  <tr><td>Guest Name</td><td>{$guestName}</td></tr>
  <tr><td>Mobile No</td><td>{$phone}</td></tr>
  <tr><td>Lodge Name</td><td>{$lodgeName}</td></tr>
  <tr><td>Room Type</td><td>{$roomType} ({$roomName})</td></tr>
  <tr><td>No. of Rooms</td><td>{$rooms}</td></tr>

  <tr><td>Check-in</td><td>{$checkIn}</td></tr>
  <tr><td>Check-out</td><td>{$checkOut}</td></tr>
  <tr><td>Check-in Time</td><td>{$checkInTime}</td></tr>
  <tr><td>Check-out Time</td><td>{$checkOutTime}</td></tr>
  <tr><td>Guests</td><td>{$guests}</td></tr>
</table>

<table>
  <tr class="fin-header"><td>Description</td><td>Amount (₹)</td></tr>
  <tr><td>Total Room Rent</td><td>{$amount}</td></tr>
  <tr><td>Advance Paid (Online)</td><td>-{$amountPaid}</td></tr>
  <tr class="fin-total"><td>Balance Amount (Pay at Lodge)</td><td>{$balanceAmount}</td></tr>
</table>

<table>
  <tr><td>Payment Mode</td><td>{$paymentMode}</td></tr>
  <tr><td>UTR / Transaction ID</td><td>{$paymentId}</td></tr>
  <tr><td>Advance Payment Status</td><td>{$paymentStatus}</td></tr>
  <tr><td>Balance Payment Status</td><td>PAY AT LODGE</td></tr>
</table>

<p class="notes">
  Advance amount is collected only to confirm the booking.<br>
  Balance amount must be paid directly at the lodge during check-in.
</p>

<div class="footer">Thank you for choosing BhaktaNivas</div>
</body>
</html>
HTML;

        $options = new Options();
        $options->set('defaultFont', 'Helvetica');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
