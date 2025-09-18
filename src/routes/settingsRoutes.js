const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authController = require('../controllers/authController');

// Protect all settings routes - require authentication
router.use(authController.protect);

// Get user settings
router.get('/', settingsController.getSettings);

// Update settings
router.patch('/', settingsController.updateSettings);

// Generate new API key
router.post('/api-key/generate', settingsController.generateApiKey);

// Reset settings to default
router.post('/reset', settingsController.resetSettings);

// Delete settings
router.delete('/', settingsController.deleteSettings);

module.exports = router;