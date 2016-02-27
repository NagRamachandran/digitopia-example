var loopback = require('loopback');

module.exports = function () {
	return function ensureLoggedIn(req, res, next) {
		var loopbackContext = loopback.getCurrentContext();
		if (!loopbackContext.get('currentUser')) {
			res.redirect('/');
		}
		else {
			next();
		}
	};
};
