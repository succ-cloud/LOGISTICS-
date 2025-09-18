const mongoose = require('mongoose');

// Enhanced location schema with better validation
const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90,
    validate: {
      validator: function(v) {
        return !isNaN(v);
      },
      message: props => `${props.value} is not a valid latitude!`
    }
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180,
    validate: {
      validator: function(v) {
        return !isNaN(v);
      },
      message: props => `${props.value} is not a valid longitude!`
    }
  },
  name: {
    type: String,
    required: [true, 'Location name is required']
  }
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
});

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: String,
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: addressSchema
});

const trackingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['processing', 'in-transit', 'out-for-delivery', 'delivered', 'delayed', 'on-hold', 'cancelled', 'returned'],
    required: true
  },
  location: locationSchema,
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const trackingSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^GT-[0-9A-Z]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid tracking ID format! Format should be GT-XXXXXXXXXX where X is alphanumeric`
    }
  },
  shipmentType: {
    type: String,
    enum: ['standard', 'express', 'priority', 'economy'],
    required: true
  },
  shipmentDate: {
    type: Date,
    required: true
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  dimensions: String,
  packageDescription: String,
  currentStatus: {
    type: String,
    enum: ['processing', 'in-transit', 'out-for-delivery', 'delivered', 'delayed', 'on-hold', 'cancelled', 'returned'],
    default: 'processing'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sender: {
    type: contactSchema,
    required: true
  },
  receiver: {
    type: contactSchema,
    required: true
  },
  origin: {
    type: locationSchema,
    required: true
  },
  destination: {
    type: locationSchema,
    required: true
  },
  currentLocation: locationSchema,
  history: [trackingHistorySchema],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
trackingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate progress based on history
trackingSchema.methods.calculateProgress = function() {
  if (this.currentStatus === 'delivered') {
    return 100;
  }
  
  if (this.currentStatus === 'processing') {
    return 10;
  }
  
  if (this.currentStatus === 'in-transit') {
    // Calculate based on time elapsed vs total estimated time
    const now = new Date();
    const startDate = this.shipmentDate;
    const endDate = this.estimatedDelivery;
    
    const totalTime = endDate - startDate;
    const elapsedTime = now - startDate;
    
    // Calculate progress as percentage of elapsed time, capped between 10-90%
    let progress = Math.floor((elapsedTime / totalTime) * 100);
    progress = Math.max(10, Math.min(90, progress)); // Ensure between 10-90
    
    return progress;
  }
  
  if (this.currentStatus === 'out-for-delivery') {
    return 90;
  }
  
  if (this.currentStatus === 'on-hold') {
    // For on-hold, we'll keep the current progress but cap it at 75%
    return Math.min(this.progress || 50, 75);
  }
  
  // Delayed or other statuses
  return this.progress;
};

const Tracking = mongoose.model('Tracking', trackingSchema);

module.exports = Tracking;