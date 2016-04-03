var getModelInfo = require('../lib/admin.js');
var getCurrentUser = require('../middleware/context-currentUser');
var ensureLoggedIn = require('../middleware/context-ensureLoggedIn');
var ensureAdminUser = require('../middleware/context-ensureAdminUser');

module.exports = function (server) {
	var router = server.loopback.Router();

	var userAuth = [getCurrentUser(), ensureAdminUser()];

	router.get('/schema/:model', userAuth, function (req, res, next) {
		if (!server.models[req.params.model]) {
			res.sendStatatus(404);
		}
		else {
			var schema = getModelInfo(server, req.params.model);
			res.send(schema);
		}
	});

	// need login
	router.get('/admin/need-login', function (req, res, next) {
		res.render('admin/views/need-login.jade');
	});

	// dashboard
	router.get('/admin', userAuth, function (req, res, next) {
		res.render('admin/dash.jade');
	});

	// list instances in model
	router.get(/^\/admin\/views\/([^\/]*)\/index$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var schema = getModelInfo(server, model);

		res.render('admin/views/index.jade', {
			model: model
		});
	});

	// view instance properties
	router.get(/^\/admin\/views\/([^\/]*)\/add$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var schema = getModelInfo(server, model);

		res.render('admin/views/add.jade', {
			model: model
		});
	});

	// edit instance properties
	router.get(/^\/admin\/views\/([^\/]*)\/edit$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var schema = getModelInfo(server, model);

		res.render('admin/views/edit.jade', {
			model: model
		});
	});

	router.get(/^\/admin\/views\/([^\/]*)\/view$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var schema = getModelInfo(server, model);

		var childRelations = [];
		for (var relation in schema.relations) {
			if (schema.relations[relation].type === 'hasMany') {
				var rel = {};
				rel[relation] = schema.relations[relation];
				childRelations.push(rel);
			}
		}

		res.render('admin/views/view.jade', {
			model: model,
			childRelations: childRelations
		});
	});

	server.use(router);
};
