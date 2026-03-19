const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Lodge } = require('../models');
const { generateToken } = require('../middleware/auth');

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email, include password for comparison
        const user = await User.findOne({ email }).populate('lodge');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password (supports both hashed and plain text for backward compatibility)
        let isMatch = false;

        // Try bcrypt compare first (hashed password)
        if (user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Plain text comparison (legacy, not secure)
            isMatch = password === user.password;
        }

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        // Convert to object and remove password
        const userObj = user.toObject({ virtuals: true });
        delete userObj.password;
        delete userObj._id;

        res.json({
            success: true,
            user: userObj,
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register Route (Super Admin only can create users, but we'll add a basic registration for initial setup)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, lodgeId } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'admin',
            lodgeId: lodgeId || null
        });

        const token = generateToken(user._id, user.role);

        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({
            success: true,
            user: userObj,
            token
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get current user (requires token)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mantralayam_secret_key');
        const user = await User.findById(decoded.userId).select('-password').populate('lodge');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (err) {
        console.error('Get current user error:', err);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;
