const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/testimonials — logged-in users only
router.post('/', requireAuth, async (req, res) => {
    try {
        const { quote, rating } = req.body;
        if (!quote || !rating) {
            return res.status(400).json({ message: 'Quote and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if testimonial from this user already exists
        const existing = await Testimonial.findOne({ user: req.user.id });
        if (existing) {
            return res.status(400).json({ message: "You've already submitted feedback." });
        }

        const testimonial = await Testimonial.create({
            user: req.user.id,
            quote,
            rating,
            approved: false
        });

        res.status(201).json(testimonial);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// GET /api/testimonials — public
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10);
        let query = Testimonial.find({ approved: true })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        if (!isNaN(limit) && limit > 0) {
            query = query.limit(limit);
        }

        const testimonials = await query.lean();
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// GET /api/testimonials/pending — admin only
router.get('/pending', requireAuth, requireAdmin, async (req, res) => {
    try {
        const pending = await Testimonial.find({ approved: false })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// DELETE /api/testimonials/mine — logged-in users only (MUST be before /:id route)
router.delete('/mine', requireAuth, async (req, res) => {
    try {
        const result = await Testimonial.findOneAndDelete({ user: req.user.id });
        if (!result) {
            return res.status(404).json({ message: 'No testimonial found to delete' });
        }
        res.json({ message: 'Your testimonial has been deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// PATCH /api/testimonials/:id/approve — admin only
router.patch('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        ).populate('user', 'name email');

        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.json(testimonial);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// DELETE /api/testimonials/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.json({ message: 'Testimonial deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;
