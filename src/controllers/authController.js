const jwt = require('jsonwebtoken');
const { promisify } = require('util');
// No longer need the Admin model for login
// const Admin = require('../models/adminModel');

// Function to sign a JWT token
const signToken = id => {
    // Parse JWT expiration time to handle comments in .env file
    const expiresIn = process.env.JWT_EXPIRES_IN.split('#')[0].trim();
    
    // Use a consistent ID for the admin user from .env
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn
    });
};

// Function to create and send token in response
const createSendToken = (user, statusCode, res) => {
    // Use a fixed ID for the admin user token
    const token = signToken(user.id || 'admin_user');

    res.status(statusCode).json({
        success: true,
        token,
        user // Send basic user info
    });
};

// Login handler using .env credentials
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const envUsername = process.env.ADMIN_USERNAME;
        const envPassword = process.env.ADMIN_PASSWORD;

        // 1) Check if username and password exist in request
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Please provide username and password!' });
        }

        // 2) Check if .env credentials are set
        if (!envUsername || !envPassword) {
            console.error('ADMIN_USERNAME or ADMIN_PASSWORD not set in .env file.');
            return res.status(500).json({ success: false, error: 'Server configuration error.' });
        }

        // 3) Check if provided credentials match .env credentials
        // Compare username case-insensitively, password case-sensitively
        const isUsernameMatch = username.toLowerCase() === envUsername.toLowerCase();
        const isPasswordMatch = password === envPassword;

        if (!isUsernameMatch || !isPasswordMatch) {
            return res.status(401).json({ success: false, error: 'Incorrect username or password' });
        }

        // 4) If everything ok, send token to client
        // Create a placeholder user object
        const adminUser = {
            id: 'admin_user', // Fixed ID for the admin
            username: envUsername
        };
        createSendToken(adminUser, 200, res);

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

// Protect middleware (Modified: No database check)
exports.protect = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'You are not logged in! Please log in to get access.' });
        }

        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Token is valid, attach a generic admin user object
        // No need to check if user still exists in DB for this method
        req.user = {
            id: decoded.id, // Should be 'admin_user' if logged in via .env
            username: process.env.ADMIN_USERNAME || 'admin' // Attach username from env
        };
        next();

    } catch (error) {
        console.error('Auth Protect Error:', error);
        let errorMessage = 'Authentication failed. Please log in.';
        if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid token. Please log in again!';
        } else if (error.name === 'TokenExpiredError') {
            errorMessage = 'Your token has expired! Please log in again.';
        }
        res.status(401).json({ success: false, error: errorMessage });
    }
};

// Optional: Middleware to restrict routes (can still be used if needed)
// This assumes the req.user object might have role info in the future,
// but for now, it just checks if req.user exists.
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Simple check if user is attached (meaning authenticated)
        if (!req.user) {
             return res.status(403).json({ success: false, error: 'You do not have permission to perform this action' });
        }
        // If you add roles to the placeholder user object later, you can check them here:
        // if (!roles.includes(req.user.role)) {
        //    return res.status(403).json({ success: false, error: 'You do not have permission to perform this action' });
        // }
        next();
    };
};