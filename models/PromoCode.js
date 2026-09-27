const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g., WELCOME20
    discountType: { type: String, enum: ['percentage', 'flat'], required: true }, // percentage (20%) or flat (₹200)
    discountValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 0 }, // 0 means unlimited
    currentUses: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
