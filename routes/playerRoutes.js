const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// URL Tanımlamaları
router.get('/players', playerController.getPlayers);
router.get('/wonderkids', playerController.getWonderkids);


module.exports = router;