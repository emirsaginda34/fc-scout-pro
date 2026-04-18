const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
    next(new AppError('Kaynak bulunamadi.', 404));
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode || 500;
    const payload = {
        success: false,
        error: err.message || 'Sunucu hatasi.'
    };

    if (err.details) {
        payload.details = err.details;
    }

    res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
