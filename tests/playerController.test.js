const playerController = require('../controllers/playerController');
const Player = require('../models/player');

jest.mock('../models/player');

function createRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
}

describe('playerController', () => {
    test('getPlayers returns player list', async () => {
        const skip = jest.fn().mockResolvedValue([{ name: 'A' }]);
        const limit = jest.fn().mockReturnValue({ skip });
        const sort = jest.fn().mockReturnValue({ limit });
        Player.find.mockReturnValue({ sort });
        Player.countDocuments.mockResolvedValue(1);

        const req = { query: { page: 1, limit: 12, sort: 'rating', order: 'desc' } };
        const res = createRes();

        await playerController.getPlayers(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, totalPlayers: 1 }));
    });
});
