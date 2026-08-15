const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// --- Simple in-memory cache for template listing (60s TTL) ---
let templateListCache = null;
let templateListCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function invalidateListCache() {
    templateListCache = null;
    templateListCacheTime = 0;
}

// Public: list all templates (landing page)
// - Only returns fields needed by the card grid (skips `description`)
// - Uses .lean() for faster plain-object serialization
// - Caches result in memory for 60s to avoid hitting MongoDB on every page load
router.get('/', async (req, res) => {
    try {
        const now = Date.now();
        if (templateListCache && (now - templateListCacheTime) < CACHE_TTL_MS) {
            res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
            return res.json(templateListCache);
        }

        const templates = await Template.find()
            .select('name imageUrl qualities createdAt')
            .sort({ createdAt: -1 })
            .lean();

        templateListCache = templates;
        templateListCacheTime = now;

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load templates', error: err.message });
    }
});

// Public: single template detail (returns all fields including description)
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id).lean();
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load template', error: err.message });
    }
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
        invalidateListCache();
        res.status(201).json(template);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// Admin only: update an existing template
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, description, imageUrl, qualities } = req.body;
        if (!name || !description || !imageUrl) {
            return res.status(400).json({ message: 'Name, description and image URL are required' });
        }
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { name, description, imageUrl, qualities: qualities || [] },
            { new: true, runValidators: true }
        );
        if (!template) return res.status(404).json({ message: 'Template not found' });
        invalidateListCache();
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// Admin only: delete a template
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        invalidateListCache();
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

module.exports = router;

