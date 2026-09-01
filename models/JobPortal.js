const mongoose = require('mongoose');

const jobPortalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    country: { type: String, default: '' },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('JobPortal', jobPortalSchema);