const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

function getTokenFromHeader(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}

async function requireAuth(req, res, next) {
    const token = getTokenFromHeader(req);
    if (!token) return next(new AppError('Yetkilendirme gerekli.', 401));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        const user = await User.findById(payload.userId).select('_id username role isBanned');
        if (!user) return next(new AppError('Kullanici bulunamadi.', 401));
        if (user.isBanned) return next(new AppError('Hesabiniz yasaklandigi icin erisim engellendi.', 403));
        req.user = {
            userId: user._id.toString(),
            username: user.username,
            role: user.role
        };
        return next();
    } catch {
        return next(new AppError('Gecersiz veya suresi dolmus oturum.', 401));
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return next(new AppError('Yetkilendirme gerekli.', 401));
        if (!roles.includes(req.user.role)) return next(new AppError('Bu islem icin yetkiniz yok.', 403));
        return next();
    };
}

module.exports = { requireAuth, requireRole };
