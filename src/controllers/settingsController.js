const Settings = require('../models/settingsModel');

// Helper to get default settings
const getDefaultSettings = (userId) => {
  return {
    userId,
    theme: 'system',
    notifications: {
      email: { enabled: true, frequency: 'immediate' },
      sms: { enabled: false },
      push: { enabled: true }
    },
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'UTC',
    language: 'en-US'
  };
};

// Get settings for a user
exports.getSettings = async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.id;

    // Find settings or create default
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      const defaultSettings = getDefaultSettings(userId);
      settings = await Settings.create(defaultSettings);
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find settings or create default
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      const defaultSettings = getDefaultSettings(userId);
      settings = await Settings.create(defaultSettings);
    }

    // Update fields based on request body
    const allowedFields = ['theme', 'notifications', 'dateFormat', 'timeZone', 'language'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // Save updated settings
    const updatedSettings = await settings.save();

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Generate new API key
exports.generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find settings or create default
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      const defaultSettings = getDefaultSettings(userId);
      settings = await Settings.create(defaultSettings);
    }

    // Generate new API key
    const apiKey = settings.generateApiKey();
    await settings.save();

    res.status(200).json({
      success: true,
      data: {
        apiKey,
        createdAt: settings.apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Create default settings object
    const defaultSettings = getDefaultSettings(userId);
    
    // Find and update settings, or create if not exists
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: defaultSettings },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete user settings
exports.deleteSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Settings.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};