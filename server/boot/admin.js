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

	router.get(/^\/admin\/views\/([^\/]*)\/add$/, userAuth, function (req, res, next) {
		doTemplate('add', req, res, next);
	});

	router.get(/^\/admin\/views\/([^\/]*)\/(\d+)\/view$/, userAuth, function (req, res, next) {
		doTemplate('view', req, res, next);
	});

	router.get(/^\/admin\/views\/([^\/]*)\/(\d+)\/edit$/, userAuth, function (req, res, next) {
		doTemplate('edit', req, res, next);
	});

	function doTemplate(mode, req, res, next) {
		var model = req.params[0];
		var id = req.params[1];

		var schema = getModelInfo(server, model);

		var childRelations = [];
		var parentRelations = [];
		var includes = [];

		var endpoint = req.protocol + '://' + req.get('host') + req.originalUrl;

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

		var theInstance;
		async.series([
			function resolve(cb) {
				server.models[model].findById(id, {
					include: includes
				}, function (err, instance) {
					theInstance = instance;
					cb(err, instance);
				});
			}
		], function (err, results) {
			if (err) {
				res.status(500).send('error ' + err);
			}
			if (!theInstance) {
				res.status(404).send('not found');
			}

			var parents = [];
			for (var i in parentRelations) {
				var relation = parentRelations[i];
				var related = theInstance[relation.name]();
				if (related) {
					if (relation.polymorphic) {
						var relatedModel = theInstance[relation.polymorphic.discriminator];
						var relatedSchema = getModelInfo(server, relatedModel);
						parents.push({
							name: relation.name,
							model: relatedModel,
							url: '/admin/views/' + theInstance[relation.polymorphic.discriminator] + '/' + related.id + '/view',
							description: related[relatedSchema.admin.defaultProperty]
						});
					}
					else {}
				}
			}

			var children = [];
			for (var i in childRelations) {
				var relation = childRelations[i];
				var related = theInstance[relation.name]();
				if (related) {
					var relatedModel = relation.modelTo.definition.name;
					var relatedSchema = getModelInfo(server, relatedModel);

					for (var j = 0; j < related.length; j++) {
						var child = related[j];
						var item = {
							name: relation.name,
							model: relatedModel,
							url: '/admin/views/' + relatedModel + '/' + child.id + '/view',
							description: child[relatedSchema.admin.defaultProperty]
						}
						children.push(item);
					}
				}
			}


			res.render('admin/views/instance.jade', {
				'mode': mode,
				'model': model,
				'schema': schema,
				'instance': theInstance,
				'childRelations': childRelations,
				'parentRelations': parentRelations,
				'endpoint': endpoint,
				'parents': parents,
				'children': children
			});
		});
	}

	server.use(router);
};
