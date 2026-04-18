const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

function signToken(user) {
    return jwt.sign(
        { userId: user._id.toString(), username: user.username, role: user.role },
        process.env.JWT_SECRET || 'dev_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
}

async function register(req, res, next) {
    try {
        const { username, password } = req.body;
        const normalizedUsername = username.toLowerCase();
        const existing = await User.findOne({ username: normalizedUsername });
        if (existing) throw new AppError('Kullanici adi zaten kullaniliyor.', 409);

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: normalizedUsername,
            password: hashed,
            role: 'user',
            updateLimits: { username: 0, password: 0 }
        });

        const token = signToken(user);
        res.status(201).json({
            success: true,
            token,
            user: { name: user.username, role: user.role },
            redirect: '/dashboard-sayfasi'
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) throw new AppError('Kullanici adi veya sifre hatali.', 401);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new AppError('Kullanici adi veya sifre hatali.', 401);

        const token = signToken(user);
        res.json({
            success: true,
            token,
            user: { name: user.username, role: user.role },
            redirect: '/dashboard-sayfasi'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login };
