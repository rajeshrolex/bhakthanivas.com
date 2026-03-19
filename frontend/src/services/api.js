const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.');
export const BASE_URL = isLocalhost ? `http://${window.location.hostname}:5000` : 'https://bhakthanivas.com';
export const API_BASE_URL = `${BASE_URL}/api`;

export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}/${cleanPath}`;
};

// Lodge API
export const lodgeAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/lodges?t=${new Date().getTime()}`);
        return response.json();
    },

    getBySlug: async (slug, checkIn, checkOut) => {
        let url = `${API_BASE_URL}/lodges/${slug}?t=${new Date().getTime()}`;
        if (checkIn && checkOut) {
            url += `&checkIn=${checkIn}&checkOut=${checkOut}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    create: async (lodgeData) => {
        const response = await fetch(`${API_BASE_URL}/lodges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lodgeData)
        });
        return response.json();
    },

    update: async (id, lodgeData) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lodgeData)
        });
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    toggleBlock: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lodges/${id}/block-toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }
};

// Booking API
export const bookingAPI = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/bookings?${params}`);
        return response.json();
    },

    getById: async (bookingId) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
        return response.json();
    },

    create: async (bookingData) => {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return response.json();
    },

    updateStatus: async (bookingId, status) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return response.json();
    },

    updatePaymentStatus: async (bookingId, paymentData) => {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        return response.json();
    }
};

// Dashboard API
export const dashboardAPI = {
    getStats: async (lodgeId = null) => {
        const params = lodgeId ? `?lodgeId=${lodgeId}` : '';
        const response = await fetch(`${API_BASE_URL}/dashboard/stats${params}`);
        return response.json();
    }
};

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    }
};

// User API
export const userAPI = {
    getProfile: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/users/profile/${userId}`);
        return response.json();
    },

    updateProfile: async (userId, profileData) => {
        const response = await fetch(`${API_BASE_URL}/users/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        return response.json();
    },

    updatePassword: async (userId, passwordData) => {
        const response = await fetch(`${API_BASE_URL}/users/password/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(passwordData)
        });
        return response.json();
    }
};

// Payment API (Razorpay)
export const paymentAPI = {
    createOrder: async (bookingData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Payment create order error:', error);
            throw error;
        }
    },

    verifyPayment: async (paymentData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }
};

// Reviews API
export const reviewAPI = {
    getForLodge: async (slug) => {
        const response = await fetch(`${API_BASE_URL}/reviews/${slug}`);
        return response.json();
    },

    create: async (slug, reviewData) => {
        const response = await fetch(`${API_BASE_URL}/reviews/${slug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return response.json();
    }
};

// Upload API
export const uploadAPI = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to upload image');
        }

        return response.json();
    }
};

// Temple API
export const templeAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/temples?t=${new Date().getTime()}`);
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}?t=${new Date().getTime()}`);
        return response.json();
    },

    create: async (templeData) => {
        const response = await fetch(`${API_BASE_URL}/temples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templeData)
        });
        return response.json();
    },

    update: async (id, templeData) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templeData)
        });
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/temples/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Daily Price API
export const dailyPriceAPI = {
    getByMonth: async (lodgeId, month) => {
        const response = await fetch(`${API_BASE_URL}/daily-prices?lodgeId=${lodgeId}&month=${month}`);
        return response.json();
    },

    upsert: async (data) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/daily-prices`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        return response.json();
    },

    remove: async (id) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/daily-prices/${id}`, {
            method: 'DELETE',
            headers
        });
        return response.json();
    }
};

// Blocked Dates API
export const blockedDatesAPI = {
    getByMonth: async (lodgeId, month) => {
        const response = await fetch(`${API_BASE_URL}/blocked-dates/${lodgeId}/month/${month}`);
        return response.json();
    },

    block: async (data) => {
        // data: { lodgeId, date, reason }
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/blocked-dates`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        return response.json();
    },

    unblock: async (id) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/blocked-dates/${id}`, {
            method: 'DELETE',
            headers
        });
        return response.json();
    }
};

export default { lodgeAPI, bookingAPI, dashboardAPI, authAPI, userAPI, paymentAPI, uploadAPI, reviewAPI, templeAPI, dailyPriceAPI, blockedDatesAPI };

