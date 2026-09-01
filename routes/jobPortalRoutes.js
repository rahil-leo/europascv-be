const express = require('express');
const router = express.Router();
const JobPortal = require('../models/JobPortal');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const portals = await JobPortal.find().sort({ country: 1, name: 1 }).lean();
        res.json(portals);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load job portals', error: err.message });
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, url, country, description } = req.body;
        if (!name || !url) {
            return res.status(400).json({ message: 'Name and URL are required' });
        }
        const portal = await JobPortal.create({ name, url, country: country || '', description: description || '' });
        res.status(201).json(portal);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, url, country, description } = req.body;
        const portal = await JobPortal.findByIdAndUpdate(
            req.params.id,
            { name, url, country: country || '', description: description || '' },
            { new: true, runValidators: true }
        );
        if (!portal) return res.status(404).json({ message: 'Job portal not found' });
        res.json(portal);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const portal = await JobPortal.findByIdAndDelete(req.params.id);
        if (!portal) return res.status(404).json({ message: 'Job portal not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;