// AuthContext.jsx – Global authentication state management
// BUG FIX: import statement was placed AFTER the createContext call,
// which is technically invalid and can cause linting/transpile errors.
// All imports must be at the top of the file.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore persisted auth state from localStorage on first mount
    useEffect(() => {
        const storedUser  = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                // BUG FIX: JSON.parse can throw if localStorage value is corrupt.
                // Wrapping in try/catch prevents a hard crash on load.
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (_) {
                // Corrupt data – clear it so the user can log in cleanly
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            // BUG FIX: previously called response.json() without checking response.ok,
            // so a 500 or CORS error would silently return { success: false } with no
            // useful message. Now we surface the real HTTP error to the caller.
            if (!response.ok) {
                let errMsg = `Server error (${response.status})`;
                try {
                    const errData = await response.json();
                    errMsg = errData.error || errData.message || errMsg;
                } catch (_) { /* ignore */ }
                return { success: false, message: errMsg };
            }

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                return { success: true };
            }

            return { success: false, message: data.error || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    // Build Authorization + Content-Type headers for authenticated API calls
    const getAuthHeaders = () => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    };

    // Returns true if the current user is a super_admin
    const isSuperAdmin = () => user?.role === 'super_admin';

    // Returns true if the current user has any admin role
    const isAdmin = () => user?.role === 'admin' || user?.role === 'super_admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                updateUser,
                loading,
                getAuthHeaders,
                isSuperAdmin,
                isAdmin,
            }}
        >
            {/* Don't render children until auth state is resolved to avoid flash */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
