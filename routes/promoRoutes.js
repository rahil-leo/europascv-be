const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const Template = require('../models/Template');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/promos - Create a new promo code (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { code, discountType, discountValue, maxUses } = req.body;
        
        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Promo code already exists' });

        const promo = await PromoCode.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            maxUses: maxUses || 0
        });
        res.status(201).json(promo);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create promo code' });
    }
});

// GET /api/promos - Get all promo codes (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const promos = await PromoCode.find().sort('-createdAt');
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch promo codes' });
    }
});

// PATCH /api/promos/:id/toggle - Activate/Deactivate (Admin only)
router.patch('/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Promo not found' });
        
        promo.isActive = !promo.isActive;
        await promo.save();
        res.json(promo);
    } catch (err) {
        res.status(500).json({ message: 'Failed to toggle status' });
    }
});

// POST /api/promos/validate - Validate a code and return discounted price (Public)
router.post('/validate', async (req, res) => {
    try {
        const { code, templateId } = req.body;
        
        // Find promo
        const promo = await PromoCode.findOne({ code: code.toUpperCase() });
        if (!promo) return res.status(404).json({ message: 'Invalid promo code' });
        
        if (!promo.isActive) return res.status(400).json({ message: 'This promo code is no longer active' });
        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
            return res.status(400).json({ message: 'This promo code has reached its usage limit' });
        }

        // Find template to apply discount to
        const template = await Template.findById(templateId);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        let discountedPrice = template.price;
        if (promo.discountType === 'percentage') {
            discountedPrice = template.price - (template.price * (promo.discountValue / 100));
        } else if (promo.discountType === 'flat') {
            discountedPrice = template.price - promo.discountValue;
        }

        // Ensure price doesn't go below 0
        discountedPrice = Math.max(0, Math.floor(discountedPrice));

        res.json({
            valid: true,
            originalPrice: template.price,
            discountedPrice,
            discountType: promo.discountType,
            discountValue: promo.discountValue
        });

    } catch (err) {
        res.status(500).json({ message: 'Validation failed' });
    }
});

module.exports = router;
