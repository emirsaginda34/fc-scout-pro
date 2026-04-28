const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/users', requireAuth, requireRole('admin'), adminController.listUsers);
router.patch('/admin/users/:id/ban', requireAuth, requireRole('admin'), adminController.toggleUserBan);

module.exports = router;
