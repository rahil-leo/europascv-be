const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },

    // Optional profile fields — not required, filled after registration
    phone:   { type: String, default: '' },
    address: { type: String, default: '' },
    avatar:  { type: String, default: '' }, // Cloudinary URL
}, { timestamps: true });

// Virtual: profile is complete when all three optional fields are filled
userSchema.virtual('profileComplete').get(function () {
    return !!(this.phone && this.address && this.avatar);
});

// Include virtuals when serialising to JSON / plain object
userSchema.set('toJSON',   { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
