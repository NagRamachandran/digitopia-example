var admin = require('digitopia-admin');
var getCurrentUser = require('../middleware/context-currentUser');
var ensureAdminUser = require('../middleware/context-ensureAdminUser');

module.exports = function (server) {

	if (process.env.ADMIN) {
		function dashboard(cb) {
			cb(null, 'hi from dashboard');
		}

		var userAuth = [getCurrentUser(), ensureAdminUser()];
		var options = {
			'i18n': true,
			'dashboard': dashboard
		};
		admin.adminBoot(server, userAuth, 'MyUser', ['MyUser', 'TypeTestLookup', 'OgTag'], options);
	}
};
