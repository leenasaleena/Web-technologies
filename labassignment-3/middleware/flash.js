// middleware/flash.js
const flash = require('connect-flash');

function setupFlash(app) {
    app.use(flash());
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success');
        res.locals.error_msg = req.flash('error');
        next();
    });
}

module.exports = setupFlash;