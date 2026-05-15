const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const Service = require('./models/Service');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Session configuration
app.use(session({
    secret: 'beehive-dental-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/beehive_dental')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Make session available to views
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// ============ ADMIN AUTHENTICATION ============
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'beehive123';

function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// ============ PUBLIC ROUTES ============
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/services', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        
        const search = req.query.search || '';
        const category = req.query.category || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 10000;
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        
        let filter = {};
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (category && category !== '') filter.category = category;
        filter.price = { $gte: minPrice, $lte: maxPrice };
        
        let sortConfig = {};
        if (sortBy === 'price') sortConfig.price = sortOrder;
        else if (sortBy === 'rating') sortConfig.rating = sortOrder;
        else sortConfig.name = sortOrder;
        
        const totalServices = await Service.countDocuments(filter);
        const totalPages = Math.ceil(totalServices / limit);
        
        const services = await Service.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(limit);
        
        const categories = await Service.distinct('category');
        
        res.render('services', {
            services: services || [],
            currentPage: page,
            totalPages: totalPages,
            totalServices: totalServices,
            limit: limit,
            search: search,
            category: category,
            minPrice: minPrice,
            maxPrice: maxPrice,
            sortBy: sortBy,
            sortOrder: sortOrder === -1 ? 'desc' : 'asc',
            categories: categories || [],
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

// ============ ADMIN ROUTES ============

// Login page
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

// Login POST
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.username = username;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Invalid username or password' });
    }
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Admin Dashboard - Show all services
app.get('/admin', isAuthenticated, async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.render('admin/dashboard', { services: services || [] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading admin panel: ' + error.message);
    }
});

// Show create form
app.get('/admin/create', isAuthenticated, (req, res) => {
    res.render('admin/create');
});

// Create new service
app.post('/admin/create', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, rating, stock, duration, description } = req.body;
        
        if (!name || !category || !price || !duration || !description) {
            return res.status(400).send('All required fields must be filled');
        }
        
        let imageUrl = '/images/placeholder.jpg';
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        
        const newService = new Service({
            name: name,
            category: category,
            price: parseFloat(price),
            rating: parseFloat(rating) || 4.5,
            stock: parseInt(stock) || 100,
            duration: duration,
            description: description,
            imageUrl: imageUrl
        });
        
        await newService.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating service: ' + error.message);
    }
});

// Show edit form
app.get('/admin/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).send('Service not found');
        }
        res.render('admin/edit', { service: service });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading edit page: ' + error.message);
    }
});

// Update service
app.post('/admin/edit/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, rating, stock, duration, description } = req.body;
        const service = await Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).send('Service not found');
        }
        
        service.name = name;
        service.category = category;
        service.price = parseFloat(price);
        service.rating = parseFloat(rating) || 4.5;
        service.stock = parseInt(stock) || 100;
        service.duration = duration;
        service.description = description;
        
        if (req.file) {
            service.imageUrl = `/uploads/${req.file.filename}`;
        }
        
        await service.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating service: ' + error.message);
    }
});

// Delete service
app.get('/admin/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting service: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Beehive Dental running at http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin/login`);
    console.log(`Default Login: admin / beehive123`);
});