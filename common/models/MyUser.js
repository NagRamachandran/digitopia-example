var loopback = require('loopback');
var server = require('../../server/server');
var uploadable = require('../../server/lib/uploadable');
var async = require('async');

module.exports = function (MyUser) {

	// on login set access_token cookie with same ttl as loopback's accessToken
	MyUser.afterRemote('login', function setLoginCookie(context, accessToken, next) {
		var res = context.res;
		var req = context.req;
		if (accessToken != null) {
			if (accessToken.id != null) {
				res.cookie('access_token', accessToken.id, {
					signed: req.signedCookies ? true : false,
					maxAge: 1000 * accessToken.ttl
				});
				return res.redirect('/');
			}
		}
		return next();
	});

	// define polymorphic hasMany relationship from MyUser to Upload
	MyUser.on('attached', function () {
		MyUser.hasMany(server.models.Upload, {
			as: 'uploads',
			'polymorphic': {
				foreignKey: 'uploadableId',
				discriminator: 'uploadableType'
			}
		});

		// MySQL: set type of discriminatior property because default
		// in jugglingDB is varchar(512) which is too big to index
		server.models.Upload.dataSource.defineProperty('Upload', 'uploadableType', {
			type: 'string',
			length: 30,
			index: true
		});
	});

	// cleanup the uploads before destroying user
	MyUser.observe('before delete', function (ctx, doneObserving) {
		MyUser.find({
			where: ctx.where,
			include: ['uploads']
		}, function (err, users) {
			async.map(users, function (user, cb) {
				user.uploads.destroyAll(cb);
			}, function (err, obj) {
				doneObserving(err);
			});
		});
	});

	// upload a file and store metadata in an Upload instance for MyUser
	MyUser.upload = function (id, property, ctx, cb) {
		var loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');
		var roles = loopbackContext.get('currentUserRoles');

		// on Upload save make versions for various UI uses
		var versions = [{
			suffix: 'large',
			quality: 90,
			maxHeight: 1040,
			maxWidth: 1040,
		}, {
			suffix: 'medium',
			quality: 90,
			maxHeight: 780,
			maxWidth: 780
		}, {
			suffix: 'thumb',
			quality: 90,
			maxHeight: 320,
			maxWidth: 320
		}, {
			suffix: 'icon',
			quality: 90,
			maxWidth: 50,
			maxHeight: 50,
			aspect: '1:1'
		}];

		// process the upload
		uploadable('MyUser', currentUser, property, ctx, versions, function (err, upload) {
			return cb(err, upload);
		});
	};

	// POST /api/MyUsers/me/upload/:property
	// property is the use for the upload eg. 'photo' or 'background' etc.
	// requires:
	// 		req.body.url - url to copy file from
	// 		- or -
	// 		req.body.uploadedFile - multipart file upload payload
	MyUser.remoteMethod(
		'upload', {
			accepts: [{
				arg: 'id',
				type: 'number',
				required: true
			}, {
				arg: 'property',
				type: 'string',
				required: true
			}, {
				arg: 'ctx',
				type: 'object',
				http: {
					source: 'context'
				}
			}],
			http: {
				path: '/:id/upload/:property',
				verb: 'post'
			},
			returns: {
				arg: 'response',
				type: 'object'
			}
		}
	);
};
