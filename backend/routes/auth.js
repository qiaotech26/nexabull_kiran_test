const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// ── In-memory captcha store (use Redis in production) ────────
const captchaStore = new Map();

// Helper: sign JWT
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        token,
        data: { user },
    });
};

// ── GET /api/auth/captcha ─────────────────────────────────────
router.get('/captcha', (req, res) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const sessionId = crypto.randomBytes(16).toString('hex');
    captchaStore.set(sessionId, { code, expires: Date.now() + 5 * 60 * 1000 });

    // Clean expired entries
    for (const [k, v] of captchaStore.entries()) {
        if (v.expires < Date.now()) captchaStore.delete(k);
    }

    // Build SVG captcha image
    const svgWidth = 160;
    const svgHeight = 50;
    const noiseLines = Array.from({ length: 6 }, () => {
        const x1 = Math.random() * svgWidth;
        const y1 = Math.random() * svgHeight;
        const x2 = Math.random() * svgWidth;
        const y2 = Math.random() * svgHeight;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#aaa" stroke-width="1" opacity="0.4"/>`;
    }).join('');

    const letters = code.split('').map((ch, i) => {
        const x = 15 + i * 24 + Math.random() * 4 - 2;
        const y = 32 + Math.random() * 6 - 3;
        const rotate = Math.random() * 20 - 10;
        const colors = ['#1a7fd4', '#2baee0', '#0e5ca0', '#14527a'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const fontSizes = [22, 24, 26, 22];
        const fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];
        return `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-family="Arial,sans-serif" font-weight="bold" transform="rotate(${rotate},${x},${y})">${ch}</text>`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" style="background:#f0f4f8;border-radius:6px">
    ${noiseLines}
    ${letters}
  </svg>`;

    res.json({
        success: true,
        sessionId,
        captchaImage: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    });
});

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { sponsorId, sponsorName, name, email, mobile, password, confirmPassword, captchaCode, captchaSessionId } = req.body;

        // Validate captcha
        const captchaEntry = captchaStore.get(captchaSessionId);
        if (!captchaEntry || captchaEntry.expires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Captcha expired. Please refresh and try again.' });
        }
        if (captchaEntry.code.toLowerCase() !== (captchaCode || '').toLowerCase()) {
            captchaStore.delete(captchaSessionId);
            return res.status(400).json({ success: false, message: 'Invalid captcha code.' });
        }
        captchaStore.delete(captchaSessionId);

        // Validate passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        // Check if sponsor exists (if not admin)
        let resolvedSponsorName = sponsorName || 'Admin';
        if (sponsorId && sponsorId !== 'ADMIN') {
            const sponsor = await User.findOne({ userId: sponsorId });
            if (!sponsor) {
                return res.status(400).json({ success: false, message: `Sponsor ID "${sponsorId}" not found.` });
            }
            resolvedSponsorName = sponsor.name;
        }

        // Check existing user
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        // Create user
        const user = await User.create({
            sponsorId: sponsorId || 'ADMIN',
            sponsorName: resolvedSponsorName,
            name,
            email,
            mobile,
            password,
        });

        // Update sponsor's referrals
        if (sponsorId && sponsorId !== 'ADMIN') {
            await User.findOneAndUpdate({ userId: sponsorId }, { $push: { referrals: user._id } });
        }

        createSendToken(user, 201, res);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or userId already exists.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { userId, password, captchaCode, captchaSessionId } = req.body;

        // Validate captcha
        const captchaEntry = captchaStore.get(captchaSessionId);
        if (!captchaEntry || captchaEntry.expires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Captcha expired. Please refresh.' });
        }
        if (captchaEntry.code.toLowerCase() !== (captchaCode || '').toLowerCase()) {
            captchaStore.delete(captchaSessionId);
            return res.status(400).json({ success: false, message: 'Invalid captcha code.' });
        }
        captchaStore.delete(captchaSessionId);

        if (!userId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide User ID and password.' });
        }

        // Find by userId or email
        const user = await User.findOne({
            $or: [{ userId }, { email: userId }],
        }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Incorrect User ID or password.' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
        }

        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
