const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { SECRET_KEY } = require('../config');
const { requireAuth } = require('../middleware/auth');

// Helper: shape the user object sent to the client
function formatUser(user) {
    return {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        phone:           user.phone   || '',
        address:         user.address || '',
        avatar:          user.avatar  || '',
        profileComplete: user.profileComplete,
    };
}

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
        res.status(201).json({ token, user: formatUser(user) });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: formatUser(user) });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: formatUser(user) });
});

// ── Update profile ────────────────────────────────────────────────────────────
// Accepts plain JSON: { phone, address, avatar (base64 data URL) }
// The avatar is resized to 200×200 in the browser before being sent — no file upload needed
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { phone, address, avatar } = req.body;
        const updates = {};

        if (phone   !== undefined) updates.phone   = String(phone).trim();
        if (address !== undefined) updates.address = String(address).trim();
        if (avatar  !== undefined) updates.avatar  = avatar; // base64 JPEG data URL

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user: formatUser(user) });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: err.message || 'Failed to update profile' });
    }
});

module.exports = router;
