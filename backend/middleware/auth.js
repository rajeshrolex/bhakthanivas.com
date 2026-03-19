const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT Token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mantralayam_secret_key');

            // Get user from database
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin only.'
        });
    }
};

// Check if user is Admin or Super Admin
const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

// Check if user owns the lodge or is super admin
const canAccessLodge = (req, res, next) => {
    const lodgeId = req.params.lodgeId || req.body.lodgeId;

    if (req.user.role === 'super_admin') {
        return next();
    }

    if (req.user.lodgeId && req.user.lodgeId.toString() === lodgeId) {
        return next();
    }

    res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own lodge.'
    });
};

// Generate JWT Token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET || 'mantralayam_secret_key',
        { expiresIn: '7d' }
    );
};

module.exports = {
    authenticate,
    isSuperAdmin,
    isAdmin,
    canAccessLodge,
    generateToken
};
