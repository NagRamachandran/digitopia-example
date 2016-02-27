var getCurrentUser = require('../middleware/context-currentUser');
var ensureLoggedIn = require('../middleware/context-ensureLoggedIn');

module.exports = function (server) {
	var router = server.loopback.Router();
	router.get('/upload', getCurrentUser(), ensureLoggedIn(), function (req, res, next) {
		res.render('upload');
	});

	server.use(router);
};
