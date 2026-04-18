const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.get('/favorites', requireAuth, favoriteController.getFavorites);
router.post('/favorites', requireAuth, favoriteController.addFavorite);
router.delete('/favorites/:playerName', requireAuth, favoriteController.removeFavorite);

module.exports = router;
