const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public: get maintenance mode status (anyone visiting the site needs this)
router.get('/maintenance', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'maintenanceMode' });
        res.json({
            enabled: setting?.value?.enabled || false,
            message: setting?.value?.message || "We're currently making some updates. Things might look a little different for a bit — thanks for your patience!"
        });
    } catch (err) {
        res.status(500).json({ enabled: false, message: '' });
    }
});

// Admin only: toggle maintenance mode
router.put('/maintenance', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { enabled, message } = req.body;
        const setting = await Settings.findOneAndUpdate(
            { key: 'maintenanceMode' },
            { value: { enabled, message } },
            { new: true, upsert: true }
        );
        res.json(setting.value);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update setting' });
    }
});

module.exports = router;