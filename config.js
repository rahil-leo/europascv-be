require('dotenv').config();

const mongoConnectionString = process.env.MONGO_URI;
const SECRET_KEY = process.env.JWT_SECRET;

if (!mongoConnectionString) {
    console.error('❌ MONGO_URI is missing! Create a backend/.env file (see .env.example).');
    process.exit(1);
}
if (!SECRET_KEY) {
    console.error('❌ JWT_SECRET is missing! Create a backend/.env file (see .env.example).');
    process.exit(1);
}

module.exports = {
    mongoConnectionString,
    SECRET_KEY
}
