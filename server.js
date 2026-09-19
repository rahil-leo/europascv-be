const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');

const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const workRoutes = require('./routes/workRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Gzip compress all responses (typically ~70% smaller for JSON/text)
app.use(compression());

// CORS with preflight caching (1 hour) to avoid redundant OPTIONS requests
app.use(cors({ maxAge: 3600 }));

app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/work', workRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/job-portals', require('./routes/jobPortalRoutes'));

// MongoDB connection with keep-alive to reduce cold-start reconnection delay
mongoose.connect(mongoConnectionString, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ===== ERROR HANDLING =====

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Optionally: send alert email, log to file, etc.
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});