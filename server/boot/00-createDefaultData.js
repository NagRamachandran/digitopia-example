var async = require('async');

module.exports = function createDefaultData(server, done) {
	if (!process.env.AUTOUPDATE) {
		return done();
	}

	var ds = server.dataSources.db;
	if (ds.connected) {
		doAutoUpdate(done);
	}
	else {
		ds.once('connected', function () {
			doAutoUpdate(done);
		});
	}

	function doAutoUpdate(done) {

		server.dataSources.db.autoupdate(function (err) {
			if (err) {
				console.log('** autoupdate error', err);
			}

			async.parallel({
				admin: async.apply(createAdminUser),
			}, function (err, results) {
				if (err) {
					console.log('** error:', err);
				}
				else {
					console.log('> defaultdata created sucessfully');
				}
				done(err);
			});
		});

		function createAdminUser(cb) {
			var theUser = null;

			var adminUser = {
				email: 'admin@digitopia.com',
				password: 'testing123'
			};

			server.models.MyUser.findOne({
				'where': {
					'email': adminUser.email
				}
			}, function (err, user) {
				if (err) {
					return cb(err);
				}
				if (user) {
					console.log('admin user already exists');
					return cb();
				}
				console.log('creating default admin user');
				async.series([
					function (callback) {
						server.models.MyUser.create(adminUser, function (err, user) {
							theUser = user;
							callback(err);
						});
					},
					function (callback) {
						server.models.Role.create({
							name: 'admin'
						}, function (err, role) {
							if (err) return callback(err);
							role.principals.create({
								principalType: server.models.RoleMapping.USER,
								principalId: theUser.id
							}, function (err, principal) {
								callback();
							});
						});
					},
					function (callback) {
						server.models.Role.create({
							name: 'superuser'
						}, function (err, role) {
							if (err) return callback(err);
							role.principals.create({
								principalType: server.models.RoleMapping.USER,
								principalId: theUser.id
							}, function (err, principal) {
								callback();
							});
						});
					}
				], function (err) {
					cb();
				});
			});
		}
	}
};
