// ===================================================================
// api.js – Centralized API service layer for BhaktaNivas frontend
// ===================================================================

// Determine base URL: use env var, or auto-detect local vs. production
const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.');

export const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (isLocalhost ? `http://${window.location.hostname}:5000/api` : '/api');

/// ── Helper: build full image URL ─────────────────────────────────────────────
export const getImageUrl = (path) => {
    if (!path) return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
    
    // If it's already a full URL, ensure it doesn't have the .comuploads or apiuploads bug
    if (path.toString().startsWith('http')) {
        return path.toString()
            .replace(/\.comuploads/g, '.com/uploads')
            .replace(/apiuploads/g, 'api/uploads');
    }

    // 1. Derive root URL (remove /api/ or /api from the end accurately)
    // We want the domain part without the /api suffix
    const root = (API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
    
    // 2. Clean the path (remove leading slash and any redundant 'api/' if it leaked in)
    let cleanPath = path.toString().replace(/^\/+/, '');
    
    // 3. Construct full URL with exactly one slash separator
    let fullUrl = root ? `${root}/${cleanPath}` : `/${cleanPath}`;
    
    // 4. Final safety pass for common malformations seen on live site
    // Handles .comuploads, apiuploads, and missed slashes
    fullUrl = fullUrl
        .replace(/\.comuploads/g, '.com/uploads')
        .replace(/apiuploads/g, 'api/uploads')
        .replace(/\/+uploads\//g, '/uploads/'); // Normalize double slashes around uploads
    
    // 5. Forceful check for protocol-relative issues if not on localhost
    if (fullUrl.startsWith('//') && !isLocalhost) {
        fullUrl = 'https:' + fullUrl;
    }

    return fullUrl;
};

// ── Helper: get authorization headers from localStorage ───────────────────────
// BUG FIX: auth headers were missing on mutating requests (create/update/delete)
// for several APIs, causing 401 Unauthorized responses.
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// ── Helper: throw on non-OK HTTP responses ────────────────────────────────────
// BUG FIX: most fetch calls did not check response.ok, silently returning
// HTML error pages (e.g. 404) as if they succeeded.
const handleResponse = async (response) => {
    if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
            const errData = await response.json();
            errMsg = errData.message || errData.error || errMsg;
            
            // Helpful note for developers: 401 + "token" usually means logout needed
            if (response.status === 401 && (errMsg.includes('token') || errMsg.includes('signature'))) {
                console.warn('Authentication failure detected:', errMsg);
            }
        } catch (_) { /* ignore parse errors */ }
        throw new Error(errMsg);
    }
    return response.json();
};

// ── Lodge API ─────────────────────────────────────────────────────────────────
export const lodgeAPI = {
    // Cache-bust to avoid stale data on repeated visits
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/lodges?t=${Date.now()}`);
        return handleResponse(response);
    },

    getBySlug: async (slug, checkIn, checkOut) => {
        let url = `${API_BASE_URL}/lodges/${slug}?t=${Date.now()}`;
        if (checkIn && checkOut) url += `&checkIn=${checkIn}&checkOut=${checkOut}`;
        const response = await fetch(url);
        return handleResponse(response);
    },

    // BUG FIX: create/update/delete/toggleBlock were missing Authorization header
    create: async (lodgeData) => {
        const response = await fetch(`${API_BASE_URL}/lodges`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(lodgeData),
        });
        return handleResponse(response);
    },

    update: async (id, lodgeData) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(lodgeData),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    toggleBlock: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}/block-toggle`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Booking API ───────────────────────────────────────────────────────────────
export const bookingAPI = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/bookings?${params}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getById: async (bookingId) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
        return handleResponse(response);
    },

    create: async (bookingData) => {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });
        return handleResponse(response);
    },

    // BUG FIX: was hitting PUT /bookings/:id (wrong), must be PUT /bookings/:id/status
    updateStatus: async (bookingId, status) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        return handleResponse(response);
    },

    updatePaymentStatus: async (bookingId, paymentData) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData),
        });
        return handleResponse(response);
    },

    cancel: async (bookingId) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardAPI = {
    getStats: async (lodgeId = null) => {
        const params = lodgeId ? `?lodgeId=${lodgeId}` : '';
        const response = await fetch(`${API_BASE_URL}/dashboard/stats${params}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRecentBookings: async (limit = 10) => {
        const response = await fetch(`${API_BASE_URL}/dashboard/recent-bookings?limit=${limit}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRevenue: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/revenue`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return handleResponse(response);
    },

    getMe: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    changePassword: async (oldPassword, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ oldPassword, newPassword }),
        });
        return handleResponse(response);
    },
};

// ── User API ──────────────────────────────────────────────────────────────────
// BUG FIX: was hitting /users/profile/:id and /users/password/:id which don't
// exist in the backend. Corrected to /users/:id (GET/PUT) as defined in users.php.
export const userAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getById: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    update: async (userId, profileData) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData),
        });
        return handleResponse(response);
    },

    delete: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Payment API (Razorpay) ────────────────────────────────────────────────────
export const paymentAPI = {
    createOrder: async (bookingData) => {
        const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });
        return handleResponse(response);
    },

    verifyPayment: async (paymentData) => {
        const response = await fetch(`${API_BASE_URL}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });
        return handleResponse(response);
    },
};

// ── Review API ────────────────────────────────────────────────────────────────
// BUG FIX: was using GET /reviews/{slug} and POST /reviews/{slug} — but the
// backend's reviews.php only supports ?lodgeId= query param (integer), not slug.
// Reviews now fetch by lodgeId and post with { lodgeId, name, rating, comment }.
export const reviewAPI = {
    getForLodge: async (lodgeId) => {
        const response = await fetch(`${API_BASE_URL}/reviews?lodgeId=${lodgeId}`);
        return handleResponse(response);
    },

    create: async (reviewData) => {
        // reviewData: { lodgeId, name, rating, comment }
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData),
        });
        return handleResponse(response);
    },

    delete: async (reviewId) => {
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Upload API ────────────────────────────────────────────────────────────────
export const uploadAPI = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        // NOTE: Do NOT set Content-Type header; browser sets it with boundary automatically
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });
        return handleResponse(response);
    },
};

// ── Daily Price API ───────────────────────────────────────────────────────────
export const dailyPriceAPI = {
    getByRange: async (lodgeId, startDate, endDate) => {
        const params = new URLSearchParams({ lodgeId, startDate, endDate });
        const response = await fetch(`${API_BASE_URL}/daily-prices?${params}`);
        return handleResponse(response);
    },

    // Legacy alias used by PriceCalendar
    getByMonth: async (lodgeId, month) => {
        const [year, mon] = month.split('-');
        const startDate = `${year}-${mon}-01`;
        const lastDay = new Date(Number(year), Number(mon), 0).getDate();
        const endDate = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
        return dailyPriceAPI.getByRange(lodgeId, startDate, endDate);
    },

    upsert: async (data) => {
        const response = await fetch(`${API_BASE_URL}/daily-prices`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    bulkUpsert: async (entries) => {
        const response = await fetch(`${API_BASE_URL}/daily-prices/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ entries }),
        });
        return handleResponse(response);
    },

    remove: async (id) => {
        const response = await fetch(`${API_BASE_URL}/daily-prices/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Blocked Dates API ─────────────────────────────────────────────────────────
// BUG FIX: getByMonth was hitting /blocked-dates/:lodgeId/month/:month which
// doesn't exist in the backend. Corrected to query-param based endpoint.
export const blockedDatesAPI = {
    getByRange: async (lodgeId, startDate, endDate) => {
        const params = new URLSearchParams({ lodgeId, startDate, endDate });
        const response = await fetch(`${API_BASE_URL}/blocked-dates?${params}`);
        return handleResponse(response);
    },

    // Legacy alias
    getByMonth: async (lodgeId, month) => {
        const [year, mon] = month.split('-');
        const startDate = `${year}-${mon}-01`;
        const lastDay = new Date(Number(year), Number(mon), 0).getDate();
        const endDate = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
        return blockedDatesAPI.getByRange(lodgeId, startDate, endDate);
    },

    block: async (data) => {
        const response = await fetch(`${API_BASE_URL}/blocked-dates`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    bulkBlock: async (dates) => {
        const response = await fetch(`${API_BASE_URL}/blocked-dates/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ dates }),
        });
        return handleResponse(response);
    },

    unblock: async (id) => {
        const response = await fetch(`${API_BASE_URL}/blocked-dates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── Temple API ────────────────────────────────────────────────────────────────
export const templeAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/temples?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    create: async (templeData) => {
        const response = await fetch(`${API_BASE_URL}/temples`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(templeData),
        });
        return handleResponse(response);
    },

    update: async (id, templeData) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(templeData),
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// ── System API ────────────────────────────────────────────────────────────────
export const systemAPI = {
    migrate: async () => {
        const response = await fetch(`${API_BASE_URL}/system/migrate`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// Default export for backward compatibility
export default {
    lodgeAPI,
    bookingAPI,
    dashboardAPI,
    authAPI,
    userAPI,
    paymentAPI,
    uploadAPI,
    reviewAPI,
    dailyPriceAPI,
    blockedDatesAPI,
    templeAPI,
    systemAPI,
};
