const express = require('express');
const router = express.Router();
const { getUser } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protected route to get user details
router.get('/user/me', protect, getUser);

module.exports = router;