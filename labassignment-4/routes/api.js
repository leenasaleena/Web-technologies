const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

// Models
const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Middleware
const { verifyToken, verifyAdmin } = require('../middleware/authJWT');

// ============ PUBLIC ENDPOINTS ============

// GET /api/v1/services - List all services with pagination & filtering
router.get('/v1/services', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        let filter = {};
        
        // Category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        // Price range filter
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
        }
        
        // Search by name
        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }
        
        // Build sort object
        let sort = {};
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        sort[sortBy] = sortOrder;
        
        const totalServices = await Service.countDocuments(filter);
        const totalPages = Math.ceil(totalServices / limit);
        
        const services = await Service.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        
        // Get unique categories for filter reference
        const categories = await Service.distinct('category');
        
        res.json({
            success: true,
            data: {
                services,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalServices,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    availableCategories: categories,
                    currentFilters: {
                        category: req.query.category || null,
                        minPrice: req.query.minPrice || null,
                        maxPrice: req.query.maxPrice || null,
                        search: req.query.search || null,
                        sortBy,
                        sortOrder: req.query.sortOrder || 'asc'
                    }
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching services' });
    }
});

// GET /api/v1/services/:id - Get single service details
router.get('/v1/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        
        res.json({ success: true, data: service });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching service' });
    }
});

// ============ AUTH ENDPOINTS (JWT) ============

// POST /api/v1/auth/login - Generate JWT token
router.post('/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user._id, 
                email: user.email, 
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
        
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

// ============ PROTECTED ENDPOINTS (require JWT) ============

// POST /api/v1/bookings - Create a new booking (protected)
router.post('/v1/bookings', verifyToken, async (req, res) => {
    try {
        const { serviceId, appointmentDate, appointmentTime, notes } = req.body;
        
        if (!serviceId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ 
                success: false, 
                error: 'Service ID, appointment date, and time are required' 
            });
        }
        
        // Verify service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        
        // Check if service is in stock/available
        if (service.stock <= 0) {
            return res.status(400).json({ success: false, error: 'Service temporarily unavailable' });
        }
        
        // Create booking
        const booking = new Booking({
            user: req.user.user_id,
            service: serviceId,
            serviceName: service.name,
            servicePrice: service.price,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            notes: notes || '',
            status: 'pending'
        });
        
        await booking.save();
        
        // Decrease stock (optional - for limited availability services)
        // service.stock -= 1;
        // await service.save();
        
        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error creating booking' });
    }
});

// GET /api/v1/user/profile - Get authenticated user's data (protected)
router.get('/v1/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Get user's bookings
        const bookings = await Booking.find({ user: req.user.user_id })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: {
                user,
                bookings: bookings
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching profile' });
    }
});

// Optional: GET /api/v1/user/bookings - Get user's bookings (protected)
router.get('/v1/user/bookings', verifyToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.user_id })
            .sort({ appointmentDate: 1 });
        
        res.json({
            success: true,
            data: bookings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching bookings' });
    }
});

// Optional: DELETE /api/v1/bookings/:id - Cancel a booking (protected)
router.delete('/v1/bookings/:id', verifyToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }
        
        // Check if booking belongs to the user OR user is admin
        if (booking.user.toString() !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'You can only cancel your own bookings' 
            });
        }
        
        // Only allow cancellation if status is pending or confirmed
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot cancel booking with status: ${booking.status}` 
            });
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error cancelling booking' });
    }
});

// Admin endpoint: Get all bookings (protected + admin only)
router.get('/v1/admin/bookings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const totalBookings = await Booking.countDocuments();
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('service', 'name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalBookings / limit),
                    totalItems: totalBookings
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching bookings' });
    }
});

module.exports = router;