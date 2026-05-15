const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('./models/Service');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beehive_dental')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Products/Services route with pagination, filtering, and sorting
app.get('/services', async (req, res) => {
    try {
        // Get query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 8; // Services per page
        const skip = (page - 1) * limit;
        
        // Filter parameters
        const search = req.query.search || '';
        const category = req.query.category || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 10000;
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        
        // Build filter object
        let filter = {};
        
        // Search filter (case-insensitive)
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        // Category filter
        if (category && category !== '') {
            filter.category = category;
        }
        
        // Price range filter
        filter.price = { $gte: minPrice, $lte: maxPrice };
        
        // Sorting configuration
        let sortConfig = {};
        if (sortBy === 'price') {
            sortConfig.price = sortOrder;
        } else if (sortBy === 'rating') {
            sortConfig.rating = sortOrder;
        } else if (sortBy === 'name') {
            sortConfig.name = sortOrder;
        } else {
            sortConfig.name = 1;
        }
        
        // Get total count for pagination
        const totalServices = await Service.countDocuments(filter);
        const totalPages = Math.ceil(totalServices / limit);
        
        // Get paginated and filtered services
        const services = await Service.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(limit);
        
        // Get unique categories for filter dropdown
        const categories = await Service.distinct('category');
        
        res.render('services', {
            services,
            currentPage: page,
            totalPages,
            totalServices,
            limit,
            search,
            category,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            categories,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server Error');
    }
});

// API endpoint for dynamic filtering (optional, for AJAX)
app.get('/api/services', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sortBy, sortOrder, page, limit } = req.query;
        // Similar logic as above but returns JSON
        // Implementation similar to the /services route
        res.json({ message: 'API endpoint ready' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Beehive Dental running at http://localhost:${PORT}`);
    console.log(`Services page available at http://localhost:${PORT}/services`);
});