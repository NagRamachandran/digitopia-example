var loopback = require('loopback');
var WError = require('verror').WError;

module.exports = function () {
	return function ensureAdminUser(req, res, next) {
		var reqContext = req.getCurrentContext();
		var roles = reqContext.get('currentUserRoles');

		if (!roles || roles.indexOf(1) === -1) {
			res.redirect('/admin/need-login');
		}
		else {
			next();
		}
	};
};
