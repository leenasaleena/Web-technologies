// middleware/auth.js
const session = require('express-session');

// Simple admin authentication (in production, use proper password hashing)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'beehive123'; // Change this to something secure!

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// Login handler
function login(req, res) {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.username = username;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { 
            error: 'Invalid username or password',
            title: 'Admin Login'
        });
    }
}

// Logout handler
function logout(req, res) {
    req.session.destroy();
    res.redirect('/admin/login');
}

module.exports = { isAuthenticated, login, logout };