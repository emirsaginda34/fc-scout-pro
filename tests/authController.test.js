const authController = require('../controllers/authController');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

jest.mock('../models/User');
jest.mock('bcryptjs');

function createRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
}

describe('authController', () => {
    test('register creates user and returns token payload', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed');
        User.create.mockResolvedValue({ _id: 'u1', username: 'test', role: 'user' });

        const req = { body: { username: 'Test', password: '123456' } };
        const res = createRes();
        const next = jest.fn();

        await authController.register(req, res, next);

        expect(User.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: expect.any(String) }));
    });

    test('login rejects invalid password', async () => {
        User.findOne.mockResolvedValue({ username: 'test', password: 'hashed', role: 'user' });
        bcrypt.compare.mockResolvedValue(false);
        const req = { body: { username: 'test', password: 'wrong' } };
        const res = createRes();
        const next = jest.fn();

        await authController.login(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
