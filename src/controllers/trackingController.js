const Tracking = require('../models/trackingModel');

// Helper function to generate a tracking ID with guaranteed uniqueness
const generateUniqueTrackingId = async () => {
  // Define a standard format for tracking numbers (12 characters is industry standard)
  // Format: GT-XXXXXXXXXX (where X is alphanumeric)
  const prefix = 'GT-';
  let isUnique = false;
  let trackingId;
  
  // Try up to 5 times to find a unique tracking ID
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate a 10-character alphanumeric code for the unique part
    // Using both letters and numbers increases uniqueness and security
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let uniquePart = '';
    
    // Generate 10 characters for the unique part
    for (let i = 0; i < 10; i++) {
      uniquePart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    trackingId = `${prefix}${uniquePart}`;
    
    // Check if this ID already exists in the database
    const existingTracking = await Tracking.findOne({ trackingId });
    
    if (!existingTracking) {
      isUnique = true;
      break;
    }
    
    console.log(`Tracking ID ${trackingId} already exists, generating a new one...`);
  }
  
  if (!isUnique) {
    throw new Error('Could not generate a unique tracking ID after multiple attempts');
  }
  
  return trackingId;
};

// Create a new tracking
exports.createTracking = async (req, res) => {
  try {
    // Check if a trackingId was provided, if not generate one
    if (!req.body.trackingId) {
      req.body.trackingId = await generateUniqueTrackingId();
    } else {
      // If trackingId was provided, check if it's unique
      const existingTracking = await Tracking.findOne({ trackingId: req.body.trackingId });
      if (existingTracking) {
        return res.status(400).json({
          success: false,
          error: 'Tracking ID already exists. Please use a different ID or let the system generate one.'
        });
      }
    }
    
    // Create the tracking record
    const newTracking = new Tracking(req.body);
    
    // Add initial history entry
    newTracking.history.push({
      status: req.body.currentStatus || 'processing',
      description: 'Shipment created',
      location: req.body.origin
    });
    
    // Calculate initial progress
    newTracking.progress = newTracking.calculateProgress();
    
    // Save the tracking
    const savedTracking = await newTracking.save();
    
    res.status(201).json({
      success: true,
      data: savedTracking
    });
  } catch (error) {
    console.error('Error creating tracking:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all trackings with optional filters
exports.getAllTrackings = async (req, res) => {
  try {
    // Build filter object from query parameters
    const filterObj = {};
    
    // Filter by status if provided
    if (req.query.status) {
      filterObj.currentStatus = req.query.status;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filterObj.shipmentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Search by tracking ID, sender name, or receiver name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filterObj.$or = [
        { trackingId: searchRegex },
        { 'sender.name': searchRegex },
        { 'receiver.name': searchRegex }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Tracking.countDocuments(filterObj);
    
    // Get trackings with filters and pagination
    const trackings = await Tracking.find(filterObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: trackings.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: trackings
    });
  } catch (error) {
    console.error('Error getting trackings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get tracking by ID
exports.getTrackingById = async (req, res) => {
  try {
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Error getting tracking by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get tracking by tracking number
exports.getTrackingByNumber = async (req, res) => {
  try {
    const tracking = await Tracking.findOne({ trackingId: req.params.trackingId });
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Error getting tracking by number:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update tracking
exports.updateTracking = async (req, res) => {
  try {
    // Find and update the tracking
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    // Update tracking fields
    Object.keys(req.body).forEach(key => {
      // Skip history as it's handled separately
      if (key !== 'history') {
        tracking[key] = req.body[key];
      }
    });
    
    // Recalculate progress
    tracking.progress = tracking.calculateProgress();
    
    // Save the updated tracking
    const updatedTracking = await tracking.save();
    
    res.status(200).json({
      success: true,
      data: updatedTracking
    });
  } catch (error) {
    console.error('Error updating tracking:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update tracking status
exports.updateTrackingStatus = async (req, res) => {
  try {
    const { status, location, description } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    // Update current status
    tracking.currentStatus = status;
    
    // Add to history
    tracking.history.push({
      status,
      description: description || `Status updated to ${status}`,
      location: location || tracking.currentLocation || tracking.origin,
      timestamp: new Date()
    });
    
    // Update current location if provided
    if (location) {
      tracking.currentLocation = location;
    }
    
    // Recalculate progress
    tracking.progress = tracking.calculateProgress();
    
    // Save the updated tracking
    const updatedTracking = await tracking.save();
    
    res.status(200).json({
      success: true,
      data: updatedTracking
    });
  } catch (error) {
    console.error('Error updating tracking status:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add tracking history entry
exports.addTrackingHistory = async (req, res) => {
  try {
    const { status, location, description } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    // Add to history
    tracking.history.push({
      status,
      description: description || `Status updated to ${status}`,
      location: location || tracking.currentLocation || tracking.origin,
      timestamp: new Date()
    });
    
    // Update current status and location
    tracking.currentStatus = status;
    if (location) {
      tracking.currentLocation = location;
    }
    
    // Recalculate progress
    tracking.progress = tracking.calculateProgress();
    
    // Save the updated tracking
    const updatedTracking = await tracking.save();
    
    res.status(200).json({
      success: true,
      data: updatedTracking
    });
  } catch (error) {
    console.error('Error adding tracking history:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete tracking
exports.deleteTracking = async (req, res) => {
  try {
    const tracking = await Tracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking not found'
      });
    }
    
    await tracking.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get stats for dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await Tracking.aggregate([
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format status counts
    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });
    
    // Get total counts
    const totalTrackings = await Tracking.countDocuments();
    const activeTrackings = await Tracking.countDocuments({ 
      currentStatus: { $in: ['processing', 'in-transit', 'out-for-delivery', 'delayed'] } 
    });
    const deliveredTrackings = await Tracking.countDocuments({ currentStatus: 'delivered' });
    
    // Get recent trackings
    const recentTrackings = await Tracking.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get trackings arriving today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const arrivingToday = await Tracking.countDocuments({
      estimatedDelivery: {
        $gte: today,
        $lt: tomorrow
      },
      currentStatus: { $ne: 'delivered' }
    });
    
    // Return the stats
    res.status(200).json({
      success: true,
      data: {
        totalTrackings,
        activeTrackings,
        deliveredTrackings,
        arrivingToday,
        statusStats,
        recentTrackings
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add a new endpoint to generate a unique tracking ID
exports.generateTrackingId = async (req, res) => {
  try {
    const trackingId = await generateUniqueTrackingId();
    
    res.status(200).json({
      success: true,
      data: { trackingId }
    });
  } catch (error) {
    console.error('Error generating tracking ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate unique tracking ID'
    });
  }
};