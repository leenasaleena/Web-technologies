// middleware/auth.js
function isLoggedIn(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'Please log in to continue');
    res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. Admin privileges required.');
    res.redirect('/');
}

// Make user data available to all views
function setUserLocals(req, res, next) {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
    } : null;
    next();
}

module.exports = { isLoggedIn, isAdmin, setUserLocals };