const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.post('/notifications/check', requireAuth, notificationController.checkFavoriteUpdates);
router.get('/notifications', requireAuth, notificationController.getNotifications);
router.patch('/notifications/:id/read', requireAuth, notificationController.markNotificationRead);

module.exports = router;
