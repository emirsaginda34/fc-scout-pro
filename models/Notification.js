const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        playerName: { type: String, required: true, trim: true },
        type: { type: String, enum: ['rating_change', 'position_change'], required: true },
        message: { type: String, required: true },
        oldValue: { type: String, required: true },
        newValue: { type: String, required: true },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
