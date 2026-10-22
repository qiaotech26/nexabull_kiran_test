const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            unique: true,
            default: () => 'NB' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        },
        sponsorId: {
            type: String,
            default: 'ADMIN',
            trim: true,
        },
        sponsorName: {
            type: String,
            default: 'Admin',
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        wallet: {
            balance: { type: Number, default: 0 },
            totalEarned: { type: Number, default: 0 },
            totalWithdrawn: { type: Number, default: 0 },
        },
        referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastLogin: { type: Date },
        passwordChangedAt: { type: Date },
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    { timestamps: true }
);

// ── Hash password before saving ──────────────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ── Instance method: compare passwords ───────────────────────
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// ── Instance method: check if password changed after JWT ─────
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
