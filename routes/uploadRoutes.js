const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'cv-site-templates',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({ storage });

// Admin only: upload a template image, returns the Cloudinary URL
router.post('/', requireAuth, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file received' });
    }
    res.status(201).json({ imageUrl: req.file.path });
});

module.exports = router;