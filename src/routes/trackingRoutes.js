const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const authController = require('../controllers/authController'); 

// PUBLIC ROUTES - these don't require authentication
// Get tracking by tracking number (Public - For clients to track shipments)
router.get('/number/:trackingId', trackingController.getTrackingByNumber);

// Get tracking by ID (Public - if needed)
router.get('/:id', trackingController.getTrackingById);

// PROTECTED ROUTES - everything below requires authentication
router.use(authController.protect);

// Generate a unique tracking ID (Protected)
router.get('/generate-id', trackingController.generateTrackingId);

// Create a new tracking (Protected)
router.post('/', trackingController.createTracking);

// Get all trackings with optional filters (Protected)
router.get('/', trackingController.getAllTrackings);

// Get stats for dashboard (Protected)
router.get('/stats/dashboard', trackingController.getDashboardStats);

// Update tracking (Protected)
router.put('/:id', trackingController.updateTracking);

// Update tracking status (Protected)
router.patch('/:id/status', trackingController.updateTrackingStatus);

// Add tracking history entry (Protected)
router.post('/:id/history', trackingController.addTrackingHistory);

// Delete tracking (Protected)
router.delete('/:id', trackingController.deleteTracking);

module.exports = router;