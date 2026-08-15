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

// Logged-in user: see their own bookings
router.get('/mine', requireAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('template', 'name imageUrl')
            .sort({ createdAt: -1 });
        res.json(bookings);
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

// Admin only: toggle status of a booking between pending and done
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        booking.status = booking.status === 'done' ? 'pending' : 'done';
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('template', 'name')
            .populate('user', 'name email');
        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;
