const express = require('express');
const router = express.Router();
const User = require('../models/user'); // User 스키마 참조

const userManagementController = require('../controllers/userManagementController');

router.post('/change', userManagementController.changeName);
router.post('/changePassword', userManagementController.changePassword);
router.delete('/:userId', userManagementController.deleteUser);

module.exports = router;
