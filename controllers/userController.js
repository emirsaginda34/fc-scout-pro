const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const MAX_USERNAME_UPDATES = 2;
const MAX_PASSWORD_UPDATES = 2;

async function getUserStatus(req, res, next) {
    try {
        const user = await User.findById(req.user.userId).select('updateLimits');
        if (!user) throw new AppError('Kullanici bulunamadi.', 404);
        res.json({ success: true, limits: user.updateLimits || { username: 0, password: 0 } });
    } catch (err) {
        next(err);
    }
}

async function updateSettings(req, res, next) {
    try {
        const { newUsername, newPassword } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) throw new AppError('Kullanici bulunamadi.', 404);

        const nextLimits = { ...user.updateLimits.toObject() };

        if (newUsername && newUsername.toLowerCase() !== user.username.toLowerCase()) {
            if (nextLimits.username >= MAX_USERNAME_UPDATES) {
                throw new AppError('Kullanici adi degistirme limitiniz doldu.', 400);
            }

            const existing = await User.findOne({ username: newUsername.toLowerCase(), _id: { $ne: user._id } });
            if (existing) throw new AppError('Yeni kullanici adi baska biri tarafindan kullaniliyor.', 409);

            user.username = newUsername.toLowerCase();
            nextLimits.username += 1;
        }

        if (newPassword) {
            if (nextLimits.password >= MAX_PASSWORD_UPDATES) {
                throw new AppError('Sifre degistirme limitiniz doldu.', 400);
            }
            user.password = await bcrypt.hash(newPassword, 10);
            nextLimits.password += 1;
        }

        user.updateLimits = nextLimits;
        await user.save();

        res.json({
            success: true,
            message: 'Ayarlar basariyla guncellendi.',
            user: { name: user.username, role: user.role },
            limits: user.updateLimits
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getUserStatus, updateSettings, MAX_USERNAME_UPDATES, MAX_PASSWORD_UPDATES };
