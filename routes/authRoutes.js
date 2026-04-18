const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiters');
const { validateBody } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);

module.exports = router;
