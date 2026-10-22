const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// All routes below are protected
router.use(protect);

// ── GET /api/user/profile ─────────────────────────────────────
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('referrals', 'userId name email createdAt status');
        res.json({ success: true, data: { user } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/user/dashboard ───────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('referrals', 'userId name createdAt status');

        const stats = {
            userId: user.userId,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            sponsorId: user.sponsorId,
            sponsorName: user.sponsorName,
            status: user.status,
            wallet: user.wallet,
            totalReferrals: user.referrals.length,
            activeReferrals: user.referrals.filter((r) => r.status === 'active').length,
            referrals: user.referrals,
            memberSince: user.createdAt,
            lastLogin: user.lastLogin,
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH /api/user/profile ───────────────────────────────────
router.patch('/profile', async (req, res) => {
    try {
        const allowedFields = ['name', 'mobile'];
        const updateData = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(req.user._id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json({ success: true, data: { user } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Admin: GET /api/user/all ──────────────────────────────────
router.get('/all', restrictTo('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(),
        ]);

        res.json({
            success: true,
            data: { users, total, page, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Admin: PATCH /api/user/:id/status ────────────────────────
router.patch('/:id/status', restrictTo('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        res.json({ success: true, data: { user } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
