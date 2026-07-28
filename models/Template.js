const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true }, // just a link/URL, no file upload needed
    qualities: [{ type: String }], // e.g. ["ATS-friendly", "1-page", "Fresher-friendly"]
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
