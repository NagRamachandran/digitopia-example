var adminBoot = require('digitopia-admin');
var getCurrentUser = require('../middleware/context-currentUser');
var ensureAdminUser = require('../middleware/context-ensureAdminUser');

module.exports = function (server) {

	function dashboard(cb) {
		cb(null, 'hi from dashboard');
	}

	var userAuth = [getCurrentUser(), ensureAdminUser()];
	var options = {
		'i18n': true,
		'dashboard': dashboard
	};
	adminBoot(server, userAuth, 'MyUsers', ['MyUser', 'TypeTestLookup'], options);
};
