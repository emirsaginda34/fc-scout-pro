const User = require('../models/User');
const AppError = require('../utils/AppError');

async function listUsers(req, res, next) {
    try {
        const users = await User.find({})
            .select('_id username role isBanned bannedAt createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, users });
    } catch (err) {
        next(err);
    }
}

async function toggleUserBan(req, res, next) {
    try {
        const { id } = req.params;
        const { isBanned } = req.body;

        if (typeof isBanned !== 'boolean') {
            throw new AppError('isBanned alani boolean olmalidir.', 400);
        }

        const targetUser = await User.findById(id);
        if (!targetUser) throw new AppError('Kullanici bulunamadi.', 404);

        if (targetUser._id.toString() === req.user.userId) {
            throw new AppError('Kendi hesabinizi yasaklayamazsiniz.', 400);
        }

        targetUser.isBanned = isBanned;
        targetUser.bannedAt = isBanned ? new Date() : null;
        await targetUser.save();

        res.json({
            success: true,
            user: {
                id: targetUser._id.toString(),
                username: targetUser.username,
                role: targetUser.role,
                isBanned: targetUser.isBanned,
                bannedAt: targetUser.bannedAt
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { listUsers, toggleUserBan };
