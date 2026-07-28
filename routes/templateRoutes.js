const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public: list all templates (landing page)
router.get('/', async (req, res) => {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
});

// Public: single template detail
router.get('/:id', async (req, res) => {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
});

// Admin only: add a new template
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, description, imageUrl, qualities } = req.body;
        if (!name || !description || !imageUrl) {
            return res.status(400).json({ message: 'Name, description and image URL are required' });
        }
        const template = await Template.create({
            name,
            description,
            imageUrl,
            qualities: qualities || []
        });
        res.status(201).json(template);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;
