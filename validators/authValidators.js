const { z } = require('zod');

const username = z.string().trim().min(3).max(30);
const password = z.string().min(6).max(100);

const registerSchema = z.object({
    username,
    password
});

const loginSchema = z.object({
    username,
    password
});

module.exports = { registerSchema, loginSchema };
