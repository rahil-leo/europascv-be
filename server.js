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

const app = express();

// Gzip compress all responses (typically ~70% smaller for JSON/text)
app.use(compression());

// CORS with preflight caching (1 hour) to avoid redundant OPTIONS requests
app.use(cors({ maxAge: 3600 }));

app.use(express.json({ limit: '5mb' }));


app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/work', require('./routes/workRoutes'));

// MongoDB connection with keep-alive to reduce cold-start reconnection delay
mongoose.connect(mongoConnectionString, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));