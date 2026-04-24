const express = require('express');
const router = express.Router();

const { getSarhaAudio } = require('../controllers/tts.controller');
const { protect } = require('../middlewares/auth.middleware');

// 🌟 FIX: protect middleware add kiya taaki req.user mil sake
router.post('/', protect, getSarhaAudio);

module.exports = router;