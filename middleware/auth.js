const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

// Checks user is logged in (valid token)
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'You need to login to do this' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'You need to login to do this' });
    }
}

// Checks user is admin (use after requireAuth)
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admins only' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
