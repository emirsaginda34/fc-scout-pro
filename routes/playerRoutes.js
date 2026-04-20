const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { playersQuerySchema, playerPayloadSchema } = require('../validators/playerValidators');

// URL Tanımlamaları
router.get('/players', requireAuth, validateQuery(playersQuerySchema), playerController.getPlayers);
router.get('/wonderkids', requireAuth, playerController.getWonderkids);
router.post('/players', requireAuth, requireRole('admin'), validateBody(playerPayloadSchema), playerController.createPlayer);
router.put('/players/:playerName', requireAuth, requireRole('admin'), validateBody(playerPayloadSchema), playerController.updatePlayer);
router.delete('/players/:playerName', requireAuth, requireRole('admin'), playerController.deletePlayer);
router.get('/compare', requireAuth, playerController.comparePlayers);

module.exports = router;