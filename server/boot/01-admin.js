var adminBoot = require('digitopia-admin');
var getCurrentUser = require('../middleware/context-currentUser');
var ensureAdminUser = require('../middleware/context-ensureAdminUser');

module.exports = function (server) {
	var userAuth = [getCurrentUser(), ensureAdminUser()];
	var options = {
		'i18n': true
	};
	adminBoot(server, userAuth, 'MyUsers', ['MyUser', 'TypeTestLookup'], options);
};
