const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function getTokenFromHeader(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}

function requireAuth(req, res, next) {
    const token = getTokenFromHeader(req);
    if (!token) return next(new AppError('Yetkilendirme gerekli.', 401));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        req.user = payload;
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
