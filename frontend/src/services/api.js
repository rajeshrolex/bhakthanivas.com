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

export const BASE_URL = API_BASE_URL;

// ── Helper: build full image URL ─────────────────────────────────────────────
export const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/400x300?text=No+Image';
    if (path.startsWith('http')) return path;
    
    // 1. Clean the path: remove leading slashes
    let cleanPath = path.replace(/^\/+/, '');
    
    // 2. Clean the base URL: remove trailing slashes
    let baseUrl = (BASE_URL || '').replace(/\/+$/, '');
    
    // 3. Special case: if baseUrl is just a domain without a path (e.g. "https://example.com"),
    // but the path doesn't start with a slash, we MUST ensure a slash exists.
    // If baseUrl is empty, it becomes a root-relative path (e.g. "/uploads")
    
    // 4. Forceful check: If for some reason the concatenated result would be "domainuploads", fix it.
    // This is a safety net for the "comuploads" issue seen on the live site.
    let fullUrl = `${baseUrl}/${cleanPath}`;
    
    // If it's a protocol-relative double slash "//", it might be interpreted as a hostname.
    // Ensure we don't start with "//" unless it's intended.
    if (fullUrl.startsWith('//') && !baseUrl.startsWith('//')) {
        fullUrl = '/' + fullUrl.replace(/^\/+/, '');
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
