const mongoose = require('mongoose');

const updateLimitsSchema = new mongoose.Schema(
    {
        username: { type: Number, default: 0 },
        password: { type: Number, default: 0 }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        updateLimits: { type: updateLimitsSchema, default: () => ({}) },
        isBanned: { type: Boolean, default: false },
        bannedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
