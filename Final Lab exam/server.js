
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const expressEjsLayouts = require('express-ejs-layouts');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

// ============ MODELS ============
const Service = require('./models/Service');
const User = require('./models/User');

// ============ SETUP ============
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ============ MIDDLEWARE ============
app.use(expressEjsLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true
}));

// Make user available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.json());
app.use('/api', apiRoutes);


// ============ DATABASE ============
mongoose.connect('mongodb://localhost:27017/beehive_dental')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// ============ AUTH MIDDLEWARE ============
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('<h1>Access Denied</h1><a href="/">Go Home</a>');
}

// ============ ROUTES ============

// Home
app.get('/', (req, res) => {
    res.render('index');
});

// Services page
app.get('/services', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        
        const totalServices = await Service.countDocuments();
        const totalPages = Math.ceil(totalServices / limit);
        const services = await Service.find().skip(skip).limit(limit);
        const categories = await Service.distinct('category');
        
        res.render('services', {
            services,
            currentPage: page,
            totalPages,
            totalServices,
            categories,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            search: '',
            category: '',
            minPrice: 0,
            maxPrice: 10000,
            sortBy: 'name',
            sortOrder: 'asc'
        });
    } catch (err) {
        res.status(500).send('Error loading services');
    }
});

// On-Sale Products page
app.get('/onsale-products', async (req, res) => {
    try {
        const onSaleProducts = await Service.find({ isOnSale: true });
        
        res.render('onsale', {
            products: onSaleProducts,
            totalProducts: onSaleProducts.length
        });
    } catch (err) {
        console.error('Error loading on-sale products:', err);
        res.status(500).send('Error loading on-sale products');
    }
});

// ============ AUTH ROUTES ============

// Login page
app.get('/auth/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('auth/login', { error: null, layout: 'auth/layout' });
});

// Login POST
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.render('auth/login', { error: 'Invalid email or password', layout: 'auth/layout' });
    }
    
const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.render('auth/login', { error: 'Invalid email or password', layout: 'auth/layout' });
    }
    
    req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
    
    if (user.role === 'admin') {
        res.redirect('/admin');
    } else {
        res.redirect('/');
    }
});

// Register page
app.get('/auth/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('auth/register', { error: null, layout: 'auth/layout' });
});

// Register POST
app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('auth/register', { error: 'Passwords do not match' });
    }
    if (password.length < 6) {
        return res.render('auth/register', { error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.render('auth/register', { error: 'Email already registered' });
    }
    
   const user = new User({
    name,
    email: email.toLowerCase(),
    password,
    role: 'customer'
});
    await user.save();
    
    res.redirect('/auth/login');
});

// Logout
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Profile
app.get('/auth/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    const user = await User.findById(req.session.user.id);
    res.render('auth/profile', { user });
});

// ============ ADMIN PANEL ============

app.get('/admin', isAdmin, async (req, res) => {
    const services = await Service.find();
    res.render('admin/dashboard', { services });
});

app.get('/admin/create', isAdmin, (req, res) => {
    res.render('admin/create');
});

app.post('/admin/create', isAdmin, upload.single('image'), async (req, res) => {
    const { name, category, price, rating, stock, duration, description } = req.body;
    
    let imageUrl = '/images/placeholder.jpg';
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;
    
    const service = new Service({
        name, category, price: parseFloat(price),
        rating: parseFloat(rating) || 4.5,
        stock: parseInt(stock) || 100,
        duration, description, imageUrl
    });
    await service.save();
    res.redirect('/admin');
});

app.get('/admin/edit/:id', isAdmin, async (req, res) => {
    const service = await Service.findById(req.params.id);
    res.render('admin/edit', { service });
});

app.post('/admin/edit/:id', isAdmin, upload.single('image'), async (req, res) => {
    const service = await Service.findById(req.params.id);
    const { name, category, price, rating, stock, duration, description } = req.body;
    
    service.name = name;
    service.category = category;
    service.price = parseFloat(price);
    service.rating = parseFloat(rating) || 4.5;
    service.stock = parseInt(stock) || 100;
    service.duration = duration;
    service.description = description;
    
    if (req.file) service.imageUrl = `/uploads/${req.file.filename}`;
    
    await service.save();
    res.redirect('/admin');
});

app.get('/admin/delete/:id', isAdmin, async (req, res) => {
    await Service.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});

// ============ START ============
app.listen(PORT, () => {
    console.log(`\n✅ Server: http://localhost:${PORT}`);
    console.log('🔑 Admin: admin@beehive.com / admin123');
    console.log('👤 Customer: customer@example.com / customer123\n');
});