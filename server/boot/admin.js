var getModelInfo = require('../lib/admin.js');
var getCurrentUser = require('../middleware/context-currentUser');
var ensureLoggedIn = require('../middleware/context-ensureLoggedIn');
var ensureAdminUser = require('../middleware/context-ensureAdminUser');
var async = require('async');

module.exports = function (server) {
	var router = server.loopback.Router();

	var userAuth = [getCurrentUser(), ensureAdminUser()];

	router.get('/admin/schema/:model', userAuth, function (req, res, next) {
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

		var q;

		if (!req.query.property) {
			req.query.property = schema.admin.listProperties[0];
		}

		if (req.query.q) {
			q = {
				'where': {}
			};
			q.where[req.query.property] = {
				'like': req.query.q + '%'
			};
		}

		server.models[model].find(q, function (err, instances) {
			res.render('admin/views/index.jade', {
				model: model,
				schema: schema,
				instances: instances,
				q: req.query.q
			});
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
	router.get(/^\/admin\/views\/([^\/]*)\/(\d+)\/edit$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var id = req.params[1];
		var schema = getModelInfo(server, model);

		server.models[model].findById(id, function (err, instance) {
			if (err) {
				res.status(500).send('error ' + err);
			}
			if (!instance) {
				res.status(404).send('not found');
			}

			res.render('admin/views/edit.jade', {
				'model': model,
				'schema': schema,
				'instance': instance,
				'endpoint': req.protocol + '://' + req.get('host') + req.originalUrl
			});
		});
	});

	router.get(/^\/admin\/views\/([^\/]*)\/(\d+)\/view$/, userAuth, function (req, res, next) {
		var model = req.params[0];
		var id = req.params[1];
		var schema = getModelInfo(server, model);

		var childRelations = [];
		var parentRelations = [];
		var includes = [];

		for (var relation in schema.relations) {
			if (schema.relations[relation].type === 'hasMany') {
				var rel = schema.relations[relation];
				childRelations.push(rel);
				includes.push(relation);
			}

			if (schema.relations[relation].type === 'belongsTo') {
				var rel = schema.relations[relation];
				parentRelations.push(rel);
				includes.push(relation);
			}
		}

		server.models[model].findById(id, {
			include: includes
		}, function (err, instance) {
			if (err) {
				res.status(500).send('error ' + err);
			}
			if (!instance) {
				res.status(404).send('not found');
			}

			res.render('admin/views/view.jade', {
				'model': model,
				'schema': schema,
				'instance': instance,
				'childRelations': childRelations,
				'parentRelations': parentRelations
			});
		});

	});

	server.use(router);
};
