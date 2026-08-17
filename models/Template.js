const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true },
    qualities: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
