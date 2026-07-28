const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Logged-in user: book a template
router.post('/', requireAuth, async (req, res) => {
    try {
        const { templateId, phone, notes } = req.body;
        if (!templateId || !phone) {
            return res.status(400).json({ message: 'Template and phone are required' });
        }
        const booking = await Booking.create({
            template: templateId,
            user: req.user.id,
            phone,
            notes: notes || ''
        });
        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// Admin only: see all bookings
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    const bookings = await Booking.find()
        .populate('template', 'name')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    res.json(bookings);
});

module.exports = router;
