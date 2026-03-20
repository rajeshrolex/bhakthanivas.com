<?php
/**
 * routes/payment.php – Razorpay Payment Routes
 *
 * POST /api/payment/create-order – Create Razorpay order
 * POST /api/payment/verify       – Verify payment signature
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$action = $seg[2] ?? '';  // 'create-order' | 'verify'

/**
 * Make a Razorpay API request via cURL.
 */
function razorpayRequest(string $endpoint, string $httpMethod, array $data = []): array
{
    $url = 'https://api.razorpay.com/v1/' . ltrim($endpoint, '/');

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_TIMEOUT        => 30,
    ]);

    if ($httpMethod === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new \RuntimeException("cURL error: {$error}");
    }

    $decoded = json_decode($response, true);
    return ['status' => $httpCode, 'body' => $decoded ?? []];
}

// ============================================================ POST /create-order
if ($method === 'POST' && $action === 'create-order') {
    $body = getBody();

    $amount = isset($body['amount']) ? (int)round((float)$body['amount'] * 100) : 0; // Razorpay uses paise
    if ($amount <= 0) {
        jsonError('Invalid amount');
    }

    $currency = $body['currency'] ?? 'INR';
    $receipt  = $body['receipt']  ?? ('rcpt_' . time());
    $notes    = $body['notes']    ?? [];

    try {
        $result = razorpayRequest('orders', 'POST', [
            'amount'          => $amount,
            'currency'        => $currency,
            'receipt'         => $receipt,
            'notes'           => $notes,
            'payment_capture' => 1,
        ]);

        if ($result['status'] !== 200) {
            $errorMsg = $result['body']['error']['description'] ?? 'Razorpay order creation failed';
            jsonError($errorMsg, 502);
        }

        jsonResponse([
            'success'  => true,
            'orderId'  => $result['body']['id'],
            'amount'   => $result['body']['amount'],
            'currency' => $result['body']['currency'],
            'keyId'    => RAZORPAY_KEY_ID,
        ]);

    } catch (\Exception $e) {
        jsonError('Payment gateway error: ' . $e->getMessage(), 502);
    }
}

// ============================================================ POST /verify
if ($method === 'POST' && $action === 'verify') {
    $body = getBody();

    $orderId   = $body['razorpay_order_id']   ?? '';
    $paymentId = $body['razorpay_payment_id'] ?? '';
    $signature = $body['razorpay_signature']  ?? '';
    $bookingId = $body['bookingId']           ?? '';

    if (empty($orderId) || empty($paymentId) || empty($signature)) {
        jsonError('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
    }

    // HMAC-SHA256 signature verification
    $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, RAZORPAY_KEY_SECRET);

    if (!hash_equals($expectedSignature, $signature)) {
        jsonError('Payment signature verification failed', 400);
    }

    // Mark booking as paid (if bookingId provided)
    if (!empty($bookingId)) {
        $booking = $db->fetchOne(
            "SELECT * FROM bookings WHERE booking_id = ? OR id = ?",
            [$bookingId, is_numeric($bookingId) ? (int)$bookingId : 0]
        );

        if ($booking) {
            $totalAmount = (float)$booking['total_amount'];
            $db->query(
                "UPDATE bookings SET
                    payment_id     = ?,
                    payment_status = 'paid',
                    amount_paid    = ?,
                    balance_amount = 0,
                    status         = 'confirmed'
                 WHERE id = ?",
                [$paymentId, $totalAmount, $booking['id']]
            );
        }
    }

    jsonResponse([
        'success'    => true,
        'verified'   => true,
        'paymentId'  => $paymentId,
        'message'    => 'Payment verified successfully',
    ]);
}

jsonError("Payment route not found: {$method} /api/payment/{$action}", 404);
