require('dotenv').config();

const mongoConnectionString = process.env.MONGO_URI;
const SECRET_KEY = process.env.JWT_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!mongoConnectionString) {
    console.error('❌ MONGO_URI is missing! Create a backend/.env file (see .env.example).');
    process.exit(1);
}
if (!SECRET_KEY) {
    console.error('❌ JWT_SECRET is missing! Create a backend/.env file (see .env.example).');
    process.exit(1);
}
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary env vars are missing! Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to backend/.env.');
    process.exit(1);
}

module.exports = {
    mongoConnectionString,
    SECRET_KEY,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
}
