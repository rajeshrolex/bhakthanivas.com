<?php
/**
 * routes/bookings.php – Booking Routes
 *
 * GET    /api/bookings                   – List bookings (admin)
 * GET    /api/bookings/:bookingId        – Single booking (public, by bookingId string)
 * POST   /api/bookings                   – Create booking
 * PUT    /api/bookings/:id/status        – Update status (admin)
 * PUT    /api/bookings/:id/payment       – Mark paid (admin)
 * DELETE /api/bookings/:id              – Cancel booking
 * GET    /api/bookings/:bookingId/invoice – PDF invoice stub
 */

declare(strict_types=1);

require_once __DIR__ . '/../utils/EmailService.php';

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
    $b['checkIn']       = $b['check_in'];
    $b['checkOut']      = $b['check_out'];
    $b['checkInTime']   = $b['check_in_time'];
    $b['totalAmount']   = (float)$b['total_amount'];
    $b['amountPaid']    = (float)$b['amount_paid'];
    $b['balanceAmount'] = (float)$b['balance_amount'];
    $b['createdAt']     = $b['created_at'];

    // Rebuild nested objects to mirror Node.js API shape
    $b['room'] = [
        'id'    => $b['room_id'],
        '_id'   => $b['room_id'],
        'type'  => $b['room_type']  ?? '',
        'name'  => $b['room_name']  ?? '',
        'price' => (float)($b['room_price'] ?? 0),
    ];
    $b['customerDetails'] = [
        'name'     => $b['customer_name'],
        'mobile'   => $b['customer_mobile'],
        'email'    => $b['customer_email'],
        'idType'   => $b['id_type'],
        'idNumber' => $b['id_number'],
    ];

    // Keep snake_case for now to avoid breaking other things, but provide camelCase too
    // Unset internal database fields that shouldn't be in the flat API response if any
    
    return $b;
}

function generateBookingId(): string
{
    return 'BH-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
}

// ============================================================ GET /bookings
if ($method === 'GET' && $rawId === null) {
    requireAuth();

    $where  = [];
    $params = [];

    if (!empty($_GET['lodgeId'])) {
        $where[]  = 'b.lodge_id = ?';
        $params[] = (int)$_GET['lodgeId'];
    }
    if (!empty($_GET['status'])) {
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

    $bookings = array_map('enrichBooking', $rows);

    jsonResponse($bookings);
}

// =========================================================== GET /bookings/:id  or /bookings/:id/invoice
if ($method === 'GET' && $rawId !== null) {

    // ---- INVOICE sub-route ----
    if ($subact === 'invoice') {
        $booking = $db->fetchOne(
            "SELECT b.*, l.name AS lodge_full_name, l.address AS lodge_address,
                    l.phone AS lodge_phone
             FROM bookings b
             LEFT JOIN lodges l ON l.id = b.lodge_id
             WHERE b.booking_id = ? OR b.id = ?",
            [$rawId, is_numeric($rawId) ? (int)$rawId : 0]
        );

        if (!$booking) jsonError('Booking not found', 404);

        // Return JSON invoice data (frontend generates PDF via jsPDF/invoiceService.js)
        $booking = enrichBooking($booking);
        jsonResponse($booking);
    }

    // ---- Single booking ----
    $booking = $db->fetchOne(
        "SELECT b.*, l.name AS lodge_full_name FROM bookings b
         LEFT JOIN lodges l ON l.id = b.lodge_id
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

    $required = ['lodgeId','roomId','checkIn','checkOut','customerName','customerMobile','guests','rooms','totalAmount','paymentMethod'];
    foreach ($required as $f) {
        if (!isset($body[$f]) || $body[$f] === '') {
            jsonError("Field '{$f}' is required");
        }
    }

    $lodgeId    = (int)$body['lodgeId'];
    $roomId     = (int)$body['roomId'];
    $checkIn    = $body['checkIn'];
    $checkOut   = $body['checkOut'];
    $numRooms   = (int)$body['rooms'];

    // ---- Availability check ----
    $room = $db->fetchOne("SELECT * FROM rooms WHERE id = ? AND lodge_id = ?", [$roomId, $lodgeId]);
    if (!$room) jsonError('Room not found in this lodge', 404);

    // Count overlapping bookings for this room
    $overlapping = $db->fetchOne(
        "SELECT COALESCE(SUM(rooms), 0) AS booked
         FROM bookings
         WHERE room_id = ?
           AND status NOT IN ('cancelled','checked-out')
           AND check_in < ? AND check_out > ?",
        [$roomId, $checkOut, $checkIn]
    );

    $totalRooms = (int)$room['total_rooms'];
    $booked     = (int)($overlapping['booked'] ?? 0);

    if (($booked + $numRooms) > $totalRooms) {
        jsonError("Not enough rooms available. Available: " . ($totalRooms - $booked) . ", Requested: {$numRooms}", 409);
    }

    // ---- Check blocked dates ----
    $blocked = $db->fetchOne(
        "SELECT id FROM blocked_dates
         WHERE lodge_id = ?
           AND date >= ? AND date < ?
         LIMIT 1",
        [$lodgeId, $checkIn, $checkOut]
    );
    if ($blocked) jsonError('Selected dates are blocked for this lodge', 409);

    // ---- Generate unique booking ID ----
    $bookingId = generateBookingId();
    while ($db->fetchOne("SELECT id FROM bookings WHERE booking_id = ?", [$bookingId])) {
        $bookingId = generateBookingId();
    }

    $lodge = $db->fetchOne("SELECT * FROM lodges WHERE id = ?", [$lodgeId]);

    $totalAmount  = (float)$body['totalAmount'];
    $amountPaid   = (float)($body['amountPaid']   ?? 0);
    $balanceAmount= (float)($body['balanceAmount'] ?? $totalAmount);
    $checkInTime  = $body['checkInTime'] ?? '12:00';

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
            $room['type'],
            $room['name'],
            (float)$room['price'],
            $checkIn,
            $checkOut,
            $checkInTime,
            (int)$body['guests'],
            $numRooms,
            $body['customerName'],
            $body['customerMobile'],
            $body['customerEmail'] ?? '',
            $body['idType']        ?? '',
            $body['idNumber']      ?? '',
            $body['paymentMethod'],
            $body['paymentId']     ?? null,
            $body['paymentStatus'] ?? 'pending',
            $totalAmount,
            $amountPaid,
            $balanceAmount,
            'confirmed',
        ]
    );

    $newId   = $db->lastInsertId();
    $booking = $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$newId]);

    // ---- Send emails ----
    if (!empty($body['customerEmail'])) {
        $emailDetails = [
            'bookingId'       => $bookingId,
            'guestName'       => $body['customerName'],
            'email'           => $body['customerEmail'],
            'phone'           => $body['customerMobile'],
            'lodgeName'       => $lodge['name'] ?? '',
            'lodgePhone'      => $lodge['phone'] ?? '',
            'lodgeWhatsapp'   => $lodge['whatsapp'] ?? '',
            'roomName'        => $room['name'],
            'checkIn'         => $checkIn,
            'checkOut'        => $checkOut,
            'checkInTime'     => $checkInTime,
            'checkOutTime'    => '11:00 AM',
            'guests'          => $body['guests'],
            'amount'          => $totalAmount,
            'amountPaid'      => $amountPaid,
            'balanceAmount'   => $balanceAmount,
            'paymentId'       => $body['paymentId'] ?? '',
            'paymentMethod'   => $body['paymentMethod'],
            'terms'           => $lodge['terms'] ?? '',
            'baseUrl'         => BASE_URL,
            'lodgeAdminEmail' => ADMIN_EMAIL,
        ];

        $emailService = new EmailService();
        $emailService->sendBookingEmails($emailDetails);
    }

    jsonResponse(enrichBooking($booking), 201);
}

// ========================================================= PUT /bookings/:id/status
if ($method === 'PUT' && $rawId !== null && $subact === 'status') {
    requireAuth();

    $body   = getBody();
    $status = $body['status'] ?? '';

    $validStatuses = ['pending','confirmed','checked-in','checked-out','cancelled'];
    if (!in_array($status, $validStatuses, true)) {
        jsonError('Invalid status: ' . implode(', ', $validStatuses));
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

    $amountPaid    = (float)($body['amountPaid']    ?? $booking['total_amount']);
    $balanceAmount = (float)($body['balanceAmount'] ?? 0);
    $paymentId     = $body['paymentId']     ?? $booking['payment_id'];
    $paymentStatus = $body['paymentStatus'] ?? 'paid';

    $db->query(
        "UPDATE bookings SET amount_paid = ?, balance_amount = ?, payment_id = ?, payment_status = ? WHERE id = ?",
        [$amountPaid, $balanceAmount, $paymentId, $paymentStatus, $booking['id']]
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
