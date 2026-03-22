<?php
/**
 * routes/bookings.php – Booking Routes
 *
 * GET    /api/bookings                    – List bookings (admin, with optional filters)
 * GET    /api/bookings/:bookingId         – Single booking (by bookingId string)
 * GET    /api/bookings/:bookingId/invoice – Download PDF invoice
 * POST   /api/bookings                    – Create booking (with validation, email, WhatsApp)
 * PUT    /api/bookings/:id/status         – Update status (admin)
 * PUT    /api/bookings/:id/payment        – Mark paid (admin)
 * DELETE /api/bookings/:id               – Cancel booking
 */

declare(strict_types=1);

require_once __DIR__ . '/../utils/EmailService.php';
require_once __DIR__ . '/../utils/WhatsappService.php';
require_once __DIR__ . '/../utils/TimeUtils.php';
require_once __DIR__ . '/../utils/InvoiceService.php';

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
// seg: ['api','bookings'] | ['api','bookings','BH-xxx'] | ['api','bookings','123','status']
$rawId  = $seg[2] ?? null;
$subact = $seg[3] ?? null;  // 'status', 'payment', 'invoice'

// ============================================================ Helpers

function enrichBooking(array $b): array
{
    $b['_id']           = $b['id'];
    $b['bookingId']     = $b['booking_id'];
    $b['lodgeId']       = $b['lodge_id'];
    $b['roomId']        = $b['room_id'];
    $b['lodgeName']     = $b['lodge_name'];
    $b['roomType']      = $b['room_type']  ?? '';
    $b['roomName']      = $b['room_name']  ?? '';
    $b['roomPrice']     = (float)($b['room_price'] ?? 0);
    $b['checkIn']       = $b['check_in'];
    $b['checkOut']      = $b['check_out'];
    $b['checkInTime']   = $b['check_in_time'] ?? '12:00';
    $b['totalAmount']   = (float)$b['total_amount'];
    $b['amountPaid']    = (float)$b['amount_paid'];
    $b['balanceAmount'] = (float)$b['balance_amount'];
    $b['paymentMethod'] = $b['payment_method'] ?? '';
    $b['paymentStatus'] = $b['payment_status'] ?? 'pending';
    $b['paymentId']     = $b['payment_id']     ?? null;
    $b['customerName']  = $b['customer_name']  ?? '';
    $b['customerMobile']= $b['customer_mobile'] ?? '';
    $b['customerEmail'] = $b['customer_email'] ?? '';
    $b['idType']        = $b['id_type']   ?? '';
    $b['idNumber']      = $b['id_number'] ?? '';
    $b['createdAt']     = $b['created_at'];

    // Rebuild nested objects to mirror Node.js API shape
    // BUG FIX: Confirmation page needs base_guests, extra_guest_price, and max_occupancy
    $b['room'] = [
        'id'    => $b['room_id'],
        '_id'   => $b['room_id'],
        'type'  => $b['room_type']  ?? '',
        'name'  => $b['room_name']  ?? '',
        'price' => (float)($b['room_price'] ?? 0),
        'baseGuests' => (int)($b['base_guests'] ?? 1),
        'extraGuestPrice' => (float)($b['extra_guest_price'] ?? 0),
        'maxOccupancy' => (int)($b['max_occupancy'] ?? 6)
    ];

    // BUG FIX: Confirmation page needs address, phone, whatsapp for lodge
    $b['lodge'] = [
        '_id'    => $b['lodge_id'],
        'name'   => $b['lodge_name'],
        'address'=> $b['lodge_address'] ?? '',
        'phone'  => $b['lodge_phone'] ?? '',
        'whatsapp' => $b['lodge_whatsapp'] ?? '',
        'images' => !empty($b['lodge_images']) ? json_decode($b['lodge_images'], true) : []
    ];

    $b['customerDetails'] = [
        'name'     => $b['customer_name'],
        'mobile'   => $b['customer_mobile'],
        'email'    => $b['customer_email'],
        'idType'   => $b['id_type'],
        'idNumber' => $b['id_number'],
    ];

    return $b;
}

/**
 * Matches Node.js: 'MLY' + last-8-digits of timestamp + 4-char random uppercase
 */
function generateBookingId(): string
{
    $ts  = (string)(int)(microtime(true) * 1000);
    $ts8 = substr($ts, -8);
    $rand = strtoupper(substr(bin2hex(random_bytes(4)), 0, 4));
    return 'MLY' . $ts8 . $rand;
}

/**
 * Format a YYYY-MM-DD date to DD-MM-YYYY (matches Node.js formatDate)
 */
function formatDate(string $date): string
{
    if (!$date) return 'N/A';
    $d = \DateTime::createFromFormat('Y-m-d', $date) ?: \DateTime::createFromFormat('Y-m-d H:i:s', $date);
    return $d ? $d->format('d-m-Y') : $date;
}

// ============================================================ GET /bookings
if ($method === 'GET' && $rawId === null) {
    requireAuth();

    // --- Auto-Checkout Logic ---
    try {
        $checkedInBookings = $db->fetchAll(
            "SELECT id, check_in, check_in_time, check_out FROM bookings WHERE status = 'checked-in'"
        );
        $currentTime = time();
        foreach ($checkedInBookings as $b) {
            $co = TimeUtils::calculateCheckOutTime(
                $b['check_in'], 
                $b['check_in_time'] ?? '12:00', 
                $b['check_out']
            );
            $coDateTimeStr = $co['checkOutDate'] . ' ' . $co['checkOutTime'] . ':00';
            if (strtotime($coDateTimeStr) <= $currentTime) {
                $db->query("UPDATE bookings SET status = 'checked-out' WHERE id = ?", [$b['id']]);
            }
        }
    } catch (\Throwable $e) {
        error_log('Auto-checkout error: ' . $e->getMessage());
    }

    $where  = [];
    $params = [];

    if (!empty($_GET['lodgeId']) && $_GET['lodgeId'] !== 'undefined' && $_GET['lodgeId'] !== 'null') {
        $where[]  = 'b.lodge_id = ?';
        $params[] = (int)$_GET['lodgeId'];
    }
    if (!empty($_GET['status']) && $_GET['status'] !== 'all') {
        $where[]  = 'b.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['startDate'])) {
        $where[]  = 'b.check_in >= ?';
        $params[] = $_GET['startDate'];
    }
    if (!empty($_GET['endDate'])) {
        $where[]  = 'b.check_in <= ?';
        $params[] = $_GET['endDate'];
    }
    if (!empty($_GET['search'])) {
        $where[]  = '(b.booking_id LIKE ? OR b.customer_name LIKE ? OR b.customer_mobile LIKE ?)';
        $s = '%' . $_GET['search'] . '%';
        $params[] = $s; $params[] = $s; $params[] = $s;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit  = min((int)($_GET['limit'] ?? 100), 500);
    $offset = (int)($_GET['page'] ?? 0) * $limit;

    $rows = $db->fetchAll(
        "SELECT b.* FROM bookings b {$whereClause} ORDER BY b.created_at DESC LIMIT {$limit} OFFSET {$offset}",
        $params
    );

    jsonResponse(array_map('enrichBooking', $rows));
}

// =========================================================== GET /bookings/:id  or /bookings/:id/invoice
if ($method === 'GET' && $rawId !== null) {

    // ---- INVOICE sub-route ----
    if ($subact === 'invoice') {
        $booking = $db->fetchOne(
            "SELECT b.*, l.name AS lodge_full_name, l.address AS lodge_address,
                    l.phone AS lodge_phone, l.whatsapp AS lodge_whatsapp, l.images AS lodge_images, l.terms AS lodge_terms,
                    r.base_guests, r.extra_guest_price, r.max_occupancy
             FROM bookings b
             LEFT JOIN lodges l ON l.id = b.lodge_id
             LEFT JOIN rooms r ON r.id = b.room_id
             WHERE b.booking_id = ? OR b.id = ?",
            [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
        );

        if (!$booking) jsonError('Booking not found', 404);
        $booking = enrichBooking($booking);

        // Compute 23-hour checkout time
        $checkoutResult = TimeUtils::calculateCheckOutTime(
            $booking['check_in'],
            $booking['checkInTime'],
            $booking['check_out']
        );

        $bookingDetails = [
            'bookingId'     => $booking['bookingId'],
            'bookingDate'   => formatDate($booking['createdAt']),
            'lodgeName'     => $booking['lodgeName'],
            'roomName'      => $booking['roomName'],
            'roomType'      => $booking['roomType'],
            'guestName'     => $booking['customerName'],
            'email'         => $booking['customerEmail'],
            'phone'         => $booking['customerMobile'],
            'checkIn'       => formatDate($booking['checkIn']),
            'checkOut'      => formatDate($booking['checkOut']),
            'checkInTime'   => TimeUtils::formatTo12Hour($booking['checkInTime'] ?? '12:00'),
            'checkOutTime'  => $checkoutResult['checkOutTime12'],
            'guests'        => $booking['guests'],
            'amount'        => $booking['totalAmount'],
            'amountPaid'    => $booking['amountPaid'],
            'balanceAmount' => $booking['balanceAmount'],
            'paymentMethod' => $booking['paymentMethod'],
            'paymentStatus' => $booking['paymentStatus'],
            'paymentId'     => $booking['paymentId'],
            'terms'         => $booking['lodge_terms'] ?? '',
        ];

        try {
            $pdf = InvoiceService::generate($bookingDetails);
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="Invoice-' . $booking['bookingId'] . '.pdf"');
            header('Content-Length: ' . strlen($pdf));
            echo $pdf;
            exit;
        } catch (\Throwable $e) {
            error_log('Invoice generation error: ' . $e->getMessage());
            jsonError('Failed to generate invoice', 500);
        }
    }

    // ---- Single booking ----
    $booking = $db->fetchOne(
        "SELECT b.*, l.name AS lodge_full_name, l.address AS lodge_address,
                l.phone AS lodge_phone, l.whatsapp AS lodge_whatsapp, l.images AS lodge_images, l.terms AS lodge_terms,
                r.base_guests, r.extra_guest_price, r.max_occupancy
         FROM bookings b
         LEFT JOIN lodges l ON l.id = b.lodge_id
         LEFT JOIN rooms r ON r.id = b.room_id
         WHERE b.booking_id = ? OR b.id = ?",
        [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
    );

    if (!$booking) {
        jsonError('Booking not found', 404);
    }

    jsonResponse(enrichBooking($booking));
}

// =========================================================== POST /bookings
if ($method === 'POST' && $rawId === null) {
    $body = getBody();

    // Required fields validation
    $required = ['lodgeId', 'checkIn', 'checkOut', 'guests', 'rooms', 'totalAmount', 'paymentMethod'];
    foreach ($required as $f) {
        if (!isset($body[$f]) || $body[$f] === '') {
            jsonError("Field '{$f}' is required");
        }
    }

    // Customer details
    $customerName   = $body['customerDetails']['name']   ?? ($body['customerName']   ?? '');
    $customerMobile = $body['customerDetails']['mobile'] ?? ($body['customerMobile'] ?? '');
    $customerEmail  = $body['customerDetails']['email']  ?? ($body['customerEmail']  ?? '');
    $idType         = $body['customerDetails']['idType'] ?? ($body['idType']  ?? '');
    $idNumber       = $body['customerDetails']['idNumber']?? ($body['idNumber'] ?? '');

    if (empty($customerName) || empty($customerMobile)) {
        jsonError('customerDetails.name and customerDetails.mobile are required');
    }

    $lodgeId  = (int)$body['lodgeId'];
    $checkIn  = $body['checkIn'];
    $checkOut = $body['checkOut'];
    $numRooms = (int)$body['rooms'];

    // --- Resolve room (supports both roomId and nested room object) ---
    $roomId   = null;
    $roomRow  = null;

    if (!empty($body['roomId'])) {
        $roomId  = (int)$body['roomId'];
        $roomRow = $db->fetchOne("SELECT * FROM rooms WHERE id = ? AND lodge_id = ?", [$roomId, $lodgeId]);
    } elseif (!empty($body['room']['name'])) {
        $roomRow = $db->fetchOne(
            "SELECT * FROM rooms WHERE lodge_id = ? AND name = ?",
            [$lodgeId, $body['room']['name']]
        );
        if ($roomRow) $roomId = (int)$roomRow['id'];
    }

    if (!$roomRow) {
        jsonError('Room not found in this lodge', 404);
    }

    // ---- Availability check (peak-night model matching Node.js) ----
    // Count peak concurrent bookings for this room across all nights of the stay
    $overlapping = $db->fetchOne(
        "SELECT COALESCE(SUM(rooms), 0) AS booked
         FROM bookings
         WHERE room_id = ?
           AND status NOT IN ('cancelled','checked-out')
           AND check_in < ? AND check_out > ?",
        [$roomId, $checkOut, $checkIn]
    );

    $totalRooms = (int)$roomRow['total_rooms'];
    $booked     = (int)($overlapping['booked'] ?? 0);

    if (($booked + $numRooms) > $totalRooms) {
        jsonError(
            "Not enough rooms available. Available: " . ($totalRooms - $booked) . ", Requested: {$numRooms}",
            409
        );
    }

    // ---- Check blocked dates for this room type ----
    if (!empty($roomRow['type'])) {
        $blockedPrice = $db->fetchOne(
            "SELECT id FROM daily_prices
             WHERE lodge_id = ? AND room_type = ? AND is_blocked = 1
               AND date >= ? AND date < ?
             LIMIT 1",
            [$lodgeId, $roomRow['type'], $checkIn, $checkOut]
        );
        if ($blockedPrice) {
            jsonError("The selected room type ({$roomRow['type']}) is unavailable on one or more of your selected dates.", 409);
        }
    }

    // ---- Check lodge-level blocked dates ----
    $blocked = $db->fetchOne(
        "SELECT id FROM blocked_dates
         WHERE lodge_id = ?
           AND date >= ? AND date < ?
         LIMIT 1",
        [$lodgeId, $checkIn, $checkOut]
    );
    if ($blocked) jsonError('Selected dates are blocked for this lodge', 409);

    // ---- Normalize payment method ('upi' -> 'online') ----
    $paymentMethod = $body['paymentMethod'];
    if ($paymentMethod === 'upi') {
        $paymentMethod = 'online';
    }

    // ---- Determine payment status ----
    $paymentStatus = 'pending';
    $paymentDetails = $body['paymentDetails'] ?? [];

    if ($paymentMethod === 'online' && ($paymentDetails['status'] ?? '') === 'paid') {
        $paymentStatus = 'paid';
    } elseif ($paymentMethod === 'payAtLodge') {
        $paymentStatus = 'pending';
    } else {
        $paymentStatus = $body['paymentStatus'] ?? ($paymentDetails['status'] ?? 'pending');
    }

    // ---- Calculate paid/balance amounts ----
    $totalAmount  = (float)$body['totalAmount'];
    $amountPaid   = 0.0;
    $balanceAmount = $totalAmount;

    if (isset($body['amountPaid']) && $body['amountPaid'] !== null) {
        $amountPaid    = (float)$body['amountPaid'];
        $balanceAmount = isset($body['balanceAmount']) ? (float)$body['balanceAmount'] : ($totalAmount - $amountPaid);
    } elseif ($paymentStatus === 'paid') {
        $amountPaid    = $totalAmount;
        $balanceAmount = 0.0;
    } elseif ($paymentMethod === 'payAtLodge') {
        $amountPaid    = 0.0;
        $balanceAmount = $totalAmount;
    }

    $checkInTime = $body['checkInTime'] ?? '12:00';
    $paymentId   = $paymentDetails['paymentId'] ?? ($body['paymentId'] ?? null);

    // ---- Generate unique booking ID (matches Node.js MLY prefix) ----
    $bookingId = generateBookingId();
    while ($db->fetchOne("SELECT id FROM bookings WHERE booking_id = ?", [$bookingId])) {
        $bookingId = generateBookingId();
    }

    $lodge = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$lodgeId]);

    $db->query(
        "INSERT INTO bookings
         (booking_id, lodge_id, lodge_name, room_id, room_type, room_name, room_price,
          check_in, check_out, check_in_time, guests, rooms,
          customer_name, customer_mobile, customer_email, id_type, id_number,
          payment_method, payment_id, payment_status,
          total_amount, amount_paid, balance_amount, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $bookingId,
            $lodgeId,
            $lodge['name'] ?? '',
            $roomId,
            $roomRow['type'],
            $roomRow['name'],
            (float)$roomRow['price'],
            $checkIn,
            $checkOut,
            $checkInTime,
            (int)$body['guests'],
            $numRooms,
            $customerName,
            $customerMobile,
            $customerEmail,
            $idType,
            $idNumber,
            $paymentMethod,
            $paymentId,
            $paymentStatus,
            $totalAmount,
            $amountPaid,
            $balanceAmount,
            'confirmed',
        ]
    );

    $newId   = $db->lastInsertId();
    $booking = $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$newId]);

    // Compute checkout time using 23-hour rule
    $checkoutResult = TimeUtils::calculateCheckOutTime($checkIn, $checkInTime, $checkOut);

    // ---- Send emails ----
    if (!empty($customerEmail)) {
        $emailDetails = [
            'bookingId'       => $bookingId,
            'guestName'       => $customerName,
            'email'           => $customerEmail,
            'phone'           => $customerMobile,
            'lodgeName'       => $lodge['name'] ?? '',
            'lodgePhone'      => $lodge['phone'] ?? '',
            'lodgeWhatsapp'   => $lodge['whatsapp'] ?? $lodge['phone'] ?? '',
            'roomName'        => $roomRow['name'],
            'checkIn'         => formatDate($checkIn),
            'checkOut'        => formatDate($checkOut),
            'checkInTime'     => $checkInTime,
            'checkOutTime'    => $checkoutResult['checkOutTime12'],
            'guests'          => $body['guests'],
            'amount'          => $totalAmount,
            'amountPaid'      => $amountPaid,
            'balanceAmount'   => $balanceAmount,
            'paymentId'       => $paymentId ?? '',
            'paymentMethod'   => $paymentMethod,
            'paymentStatus'   => $paymentStatus,
            'terms'           => $lodge['terms'] ?? '',
            'baseUrl'         => BASE_URL,
            'lodgeAdminEmail' => ADMIN_EMAIL,
        ];

        $emailService = new EmailService();
        $emailService->sendBookingEmails($emailDetails);
    }

    // ---- Send WhatsApp notification ----
    $waSvc = new WhatsappService();
    $waSvc->sendBookingNotification([
        'bookingId'     => $bookingId,
        'lodgeName'     => $lodge['name'] ?? '',
        'guestName'     => $customerName,
        'phone'         => $customerMobile,
        'amountPaid'    => $amountPaid,
        'balanceAmount' => $balanceAmount,
    ]);

    jsonResponse(enrichBooking($booking), 201);
}

// ========================================================= PUT /bookings/:id/status
if ($method === 'PUT' && $rawId !== null && $subact === 'status') {
    requireAuth();

    $body   = getBody();
    $status = $body['status'] ?? '';

    $validStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    if (!in_array($status, $validStatuses, true)) {
        jsonError('Invalid status. Must be: ' . implode(', ', $validStatuses));
    }

    $booking = $db->fetchOne(
        "SELECT * FROM bookings WHERE booking_id = ? OR id = ?",
        [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
    );
    if (!$booking) jsonError('Booking not found', 404);

    $db->query("UPDATE bookings SET status = ? WHERE id = ?", [$status, $booking['id']]);

    $updated = $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$booking['id']]);
    jsonResponse(enrichBooking($updated));
}

// ======================================================= PUT /bookings/:id/payment
if ($method === 'PUT' && $rawId !== null && $subact === 'payment') {
    requireAuth();

    $body    = getBody();
    $booking = $db->fetchOne(
        "SELECT * FROM bookings WHERE booking_id = ? OR id = ?",
        [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
    );
    if (!$booking) jsonError('Booking not found', 404);

    $paymentStatus = $body['paymentStatus'] ?? 'paid';
    $paymentMethod = $body['paymentMethod'] ?? $booking['payment_method'];
    $amountPaid    = (float)($body['amountPaid']    ?? $booking['total_amount']);
    $balanceAmount = (float)($body['balanceAmount'] ?? 0.0);

    // Generate cash payment ID if marking paid with no ID (matches Node.js)
    if ($paymentStatus === 'paid' && empty($body['paymentId'])) {
        $paymentId = 'CASH_' . time();
    } else {
        $paymentId = $body['paymentId'] ?? $booking['payment_id'];
    }

    $db->query(
        "UPDATE bookings SET amount_paid = ?, balance_amount = ?, payment_id = ?, payment_status = ?, payment_method = ? WHERE id = ?",
        [$amountPaid, $balanceAmount, $paymentId, $paymentStatus, $paymentMethod, $booking['id']]
    );

    $updated = $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$booking['id']]);
    jsonResponse(['success' => true, 'booking' => enrichBooking($updated)]);
}

// ======================================================= DELETE /bookings/:id
if ($method === 'DELETE' && $rawId !== null && $subact === null) {
    requireAuth();

    $booking = $db->fetchOne(
        "SELECT * FROM bookings WHERE booking_id = ? OR id = ?",
        [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
    );
    if (!$booking) jsonError('Booking not found', 404);

    $db->query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [$booking['id']]);

    jsonResponse(['success' => true, 'message' => 'Booking cancelled successfully']);
}

jsonError("Booking route not found: {$method}", 404);
