const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { SECRET_KEY } = require('../config');
const { requireAuth } = require('../middleware/auth');

// Helper: shape the user object sent to the client
function formatUser(user) {
    return {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        phone:           user.phone   || '',
        address:         user.address || '',
        avatar:          user.avatar  || '',
        profileComplete: user.profileComplete,
    };
}

const https = require('https');

// Helper: send OTP via EmailJS
function sendOTP(email, name, otp) {
    return new Promise((resolve, reject) => {
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY;

        // If no keys configured, just print to console (good for dev)
        if (!publicKey) {
            console.log('\n=== OTP DEV MODE ===');
            console.log(`To: ${email}\nOTP: ${otp}`);
            console.log('====================\n');
            return resolve();
        }

        const data = JSON.stringify({
            service_id: 'service_ruazlgk',
            template_id: 'template_rc3zbtk',
            user_id: publicKey,
            accessToken: privateKey,
            template_params: {
                to_name: name,
                to_email: email,
                otp: otp
            }
        });

        const options = {
            hostname: 'api.emailjs.com',
            path: '/api/v1.0/email/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                let errData = '';
                res.on('data', chunk => errData += chunk);
                res.on('end', () => reject(new Error(errData || 'EmailJS Error')));
            }
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        let user = await User.findOne({ email });
        
        // If user exists and is verified, deny registration
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const hashedPassword = await bcrypt.hash(password, 10);

        if (user) {
            // Unverified user trying again, update OTP and password
            user.name = name;
            user.password = hashedPassword;
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // New user
            user = await User.create({ 
                name, email, password: hashedPassword, isVerified: false, otp, otpExpires 
            });
        }

        await sendOTP(email, name, otp);

        // Do NOT return a token yet. Just a success message indicating OTP was sent.
        res.status(201).json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Verify OTP ───────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired. Please register again to get a new one.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Verification successful. You can now login.' });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email address first. Sign up again to receive a new OTP.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: formatUser(user) });
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: formatUser(user) });
});

// ── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if user exists or not, just say sent
            return res.json({ message: 'If an account exists, a reset OTP has been sent.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();

        await sendOTP(email, user.name, otp);
        res.json({ message: 'If an account exists, a reset OTP has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpires = undefined;
        // If they were unverified but proved they own the email via reset, consider them verified
        user.isVerified = true; 
        await user.save();

        res.json({ message: 'Password successfully reset! You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
});

// ── Update profile ────────────────────────────────────────────────────────────
// Accepts plain JSON: { phone, address, avatar (base64 data URL) }
// The avatar is resized to 200×200 in the browser before being sent — no file upload needed
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { phone, address, avatar } = req.body;
        const updates = {};

        if (phone   !== undefined) updates.phone   = String(phone).trim();
        if (address !== undefined) updates.address = String(address).trim();
        if (avatar  !== undefined) updates.avatar  = avatar; // base64 JPEG data URL

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user: formatUser(user) });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: err.message || 'Failed to update profile' });
    }
});

module.exports = router;
