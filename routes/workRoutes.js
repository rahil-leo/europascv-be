const express = require('express');
const router = express.Router();
const Work = require('../models/Work');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public: list all work items
router.get('/', async (req, res) => {
    try {
        const work = await Work.find().sort({ createdAt: -1 }).lean();
        res.json(work);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load work', error: err.message });
    }
});

// Admin only: add a new work item
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, imageUrl, description } = req.body;
        if (!title || !imageUrl) {
            return res.status(400).json({ message: 'Title and image URL are required' });
        }
        const work = await Work.create({ title, imageUrl, description: description || '' });
        res.status(201).json(work);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// Admin only: delete a work item
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const work = await Work.findByIdAndDelete(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work item not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;