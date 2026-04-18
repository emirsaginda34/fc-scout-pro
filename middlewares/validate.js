const AppError = require('../utils/AppError');

function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(new AppError('Gecersiz istek verisi.', 400, result.error.flatten()));
        }
        req.body = result.data;
        return next();
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return next(new AppError('Gecersiz sorgu parametresi.', 400, result.error.flatten()));
        }
        req.query = result.data;
        return next();
    };
}

module.exports = { validateBody, validateQuery };
