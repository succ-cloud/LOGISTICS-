const mongoose = require('mongoose');
const crypto = require('crypto');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly'],
        default: 'immediate'
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },
  apiKey: {
    key: {
      type: String,
      default: function() {
        return crypto.randomBytes(32).toString('hex');
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date
    }
  },
  dateFormat: {
    type: String,
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
    default: 'MM/DD/YYYY'
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en-US'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate a new API key
settingsSchema.methods.generateApiKey = function() {
  this.apiKey.key = crypto.randomBytes(32).toString('hex');
  this.apiKey.createdAt = Date.now();
  return this.apiKey.key;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;