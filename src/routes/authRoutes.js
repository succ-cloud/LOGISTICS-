const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);

// Example of a protected route (optional)
// router.get('/me', authController.protect, (req, res) => {
//   res.status(200).json({ success: true, user: req.user });
// });

module.exports = router;