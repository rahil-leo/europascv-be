const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// GET /api/wishlist — get current user's wishlist (populated with template data)
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('wishlist', 'name price imageUrl qualities');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
});

// POST /api/wishlist/:templateId — toggle (add or remove) a template
router.post('/:templateId', requireAuth, async (req, res) => {
    try {
        const { templateId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const index = user.wishlist.findIndex(id => id.toString() === templateId);

        if (index === -1) {
            // Not in wishlist — add it
            user.wishlist.push(templateId);
        } else {
            // Already in wishlist — remove it
            user.wishlist.splice(index, 1);
        }

        await user.save();
        res.json({ wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update wishlist' });
    }
});

module.exports = router;
