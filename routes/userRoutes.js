const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { updateSettingsSchema } = require('../validators/userValidators');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/user-status', requireAuth, userController.getUserStatus);
router.post('/update-settings', requireAuth, validateBody(updateSettingsSchema), userController.updateSettings);

module.exports = router;
