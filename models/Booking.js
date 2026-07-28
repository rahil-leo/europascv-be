const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
