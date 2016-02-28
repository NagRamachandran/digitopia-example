var loopback = require('loopback');
var server = require('../../server/server');
var uploadable = require('../../server/lib/uploadable');

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
	});

	// upload a file and store metadata in an Upload instance for MyUser
	MyUser.upload = function (id, property, ctx, cb) {
		var loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');
		var roles = loopbackContext.get('currentUserRoles');
		uploadable('MyUser', currentUser, property, ctx, function (err, upload) {
			return cb(err, upload);
		});
	};

	// POST /api/MyUsers/me/upload/photo
	// requires
	// 	req.body.url - url to copy file from
	//  - or -
	//  req.body.uploadedFile - multipart file upload payload
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
