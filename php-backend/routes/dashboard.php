<?php
/**
 * routes/dashboard.php – Admin Dashboard Routes
 *
 * GET /api/dashboard/stats          – Summary stats
 * GET /api/dashboard/recent-bookings – Latest N bookings
 * GET /api/dashboard/revenue         – Revenue breakdown by lodge/month
 */

declare(strict_types=1);

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$seg    = getPathSegments();
$action = $seg[2] ?? 'stats';  // stats | recent-bookings | revenue

requireAuth();

// ============================================================ GET /stats
if ($method === 'GET' && $action === 'stats') {
    $authUser = $GLOBALS['authUser'];
    $isSuperAdmin = ($authUser['role'] ?? '') === 'super_admin';
    $lodgeFilter  = !$isSuperAdmin ? (int)($authUser['lodgeId'] ?? 0) : null;

    $whereParams = [];
    $lodgeWhere  = '';

    if ($lodgeFilter) {
        $lodgeWhere  = 'WHERE lodge_id = ?';
        $whereParams = [$lodgeFilter];
    }

    $totals = $db->fetchOne(
        "SELECT
            COUNT(*) AS total_bookings,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed,
            COALESCE(SUM(CASE WHEN status = 'checked-in' THEN 1 ELSE 0 END), 0) AS checked_in,
            COALESCE(SUM(CASE WHEN status = 'checked-out' THEN 1 ELSE 0 END), 0) AS checked_out,
            COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending
         FROM bookings {$lodgeWhere}",
        $whereParams
    );

    // Upcoming check-ins (today + 7 days)
    $upcoming = $db->fetchOne(
        "SELECT COUNT(*) AS upcoming FROM bookings
         WHERE status IN ('confirmed','pending')
           AND check_in BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"
        . ($lodgeFilter ? ' AND lodge_id = ?' : ''),
        $lodgeFilter ? [$lodgeFilter] : []
    );

    // Today's check-ins
    $todayCheckins = $db->fetchOne(
        "SELECT COUNT(*) AS today_checkins FROM bookings
         WHERE check_in = CURDATE() AND status NOT IN ('cancelled')"
        . ($lodgeFilter ? ' AND lodge_id = ?' : ''),
        $lodgeFilter ? [$lodgeFilter] : []
    );

    // Today's check-outs
    $todayCheckouts = $db->fetchOne(
        "SELECT COUNT(*) AS today_checkouts FROM bookings
         WHERE check_out = CURDATE() AND status NOT IN ('cancelled')"
        . ($lodgeFilter ? ' AND lodge_id = ?' : ''),
        $lodgeFilter ? [$lodgeFilter] : []
    );

    // Lodge count
    $lodgeCount = $db->fetchOne(
        "SELECT COUNT(*) AS total FROM lodges" . ($lodgeFilter ? ' WHERE id = ?' : ''),
        $lodgeFilter ? [$lodgeFilter] : []
    );

    // Recent bookings
    $recentBookings = $db->fetchAll(
        "SELECT * FROM bookings {$lodgeWhere} ORDER BY created_at DESC LIMIT 5",
        $whereParams
    );
    $enrichedRecent = array_map(function ($b) {
        return [
            'id'              => $b['id'],
            '_id'             => $b['id'],
            'bookingId'       => $b['booking_id'],
            'status'          => $b['status'],
            'createdAt'       => $b['created_at'],
            'customerDetails' => [
                'name' => $b['customer_name']
            ]
        ];
    }, $recentBookings);

    jsonResponse([
        'totalBookings'   => (int)$totals['total_bookings'],
        'totalRevenue'    => (float)$totals['total_revenue'],
        'confirmed'       => (int)$totals['confirmed'],
        'checkedIn'       => (int)$totals['checked_in'],
        'checkedOut'      => (int)$totals['checked_out'],
        'cancelled'       => (int)$totals['cancelled'],
        'pending'         => (int)$totals['pending'],
        'upcomingCheckins'=> (int)$upcoming['upcoming'],
        'todayCheckins'   => (int)$todayCheckins['today_checkins'],
        'todayCheckouts'  => (int)$todayCheckouts['today_checkouts'],
        'totalLodges'     => (int)$lodgeCount['total'],
        'recentBookings'  => $enrichedRecent,
        'todayRevenue'    => (float)$totals['total_revenue'], // Simplified for now
        'pendingBookings' => (int)$totals['pending'],
        'todayCheckIns'   => (int)$todayCheckins['today_checkins'],
    ]);
}

// ============================================================ GET /recent-bookings
if ($method === 'GET' && $action === 'recent-bookings') {
    $authUser     = $GLOBALS['authUser'];
    $isSuperAdmin = ($authUser['role'] ?? '') === 'super_admin';
    $lodgeFilter  = !$isSuperAdmin ? (int)($authUser['lodgeId'] ?? 0) : null;
    $limit        = min((int)($_GET['limit'] ?? 10), 50);

    $params = [];
    $where  = '';

    if ($lodgeFilter) {
        $where   = 'WHERE lodge_id = ?';
        $params[] = $lodgeFilter;
    }

    $bookings = $db->fetchAll(
        "SELECT * FROM bookings {$where} ORDER BY created_at DESC LIMIT {$limit}",
        $params
    );

    // Enrich bookings
    $result = array_map(function ($b) {
        $b['_id']             = $b['id'];
        $b['bookingId']       = $b['booking_id'];
        $b['totalAmount']     = (float)$b['total_amount'];
        $b['room']            = ['type' => $b['room_type'], 'name' => $b['room_name'], 'price' => (float)$b['room_price']];
        $b['customerDetails'] = ['name' => $b['customer_name'], 'mobile' => $b['customer_mobile'], 'email' => $b['customer_email']];
        return $b;
    }, $bookings);

    jsonResponse(['success' => true, 'bookings' => $result]);
}

// ============================================================ GET /revenue
if ($method === 'GET' && $action === 'revenue') {
    $authUser     = $GLOBALS['authUser'];
    $isSuperAdmin = ($authUser['role'] ?? '') === 'super_admin';
    $lodgeFilter  = !$isSuperAdmin ? (int)($authUser['lodgeId'] ?? 0) : null;

    $params = [];
    $where  = "WHERE status NOT IN ('cancelled')";

    if ($lodgeFilter) {
        $where   .= ' AND lodge_id = ?';
        $params[] = $lodgeFilter;
    }

    $revenue = $db->fetchAll(
        "SELECT
            DATE_FORMAT(check_in, '%Y-%m') AS month,
            lodge_name,
            COUNT(*) AS bookings,
            COALESCE(SUM(total_amount), 0) AS revenue
         FROM bookings {$where}
         GROUP BY DATE_FORMAT(check_in, '%Y-%m'), lodge_name
         ORDER BY month DESC",
        $params
    );

    jsonResponse(['success' => true, 'revenue' => $revenue]);
}

jsonError("Dashboard route not found: {$method} /api/dashboard/{$action}", 404);
