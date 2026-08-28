const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Work', workSchema);