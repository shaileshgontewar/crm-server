const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validation');

router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.get('/me', protect, getMe);

module.exports = router;