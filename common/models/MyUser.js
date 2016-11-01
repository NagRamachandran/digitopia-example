var loopback = require('loopback');
var server = require('../../server/server');
var uploadable = require('../../server/lib/uploadable')();
var async = require('async');
var admin = require('digitopia-admin');

module.exports = function (MyUser) {

	if (process.env.ADMIN) {
		admin.setUpRoleToggleAPI(MyUser);
	}

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
			}
		}
		return next();
	});

	MyUser.afterRemote('logout', function removeLoginCookie(context, accessToken, next) {
		var res = context.res;
		var req = context.req;
		res.clearCookie('access_token', {
			signed: req.signedCookies ? true : false
		});
		return next();
	});

	// set up uploadable gear for MyUser model
	MyUser.on('attached', function () {

		// on Upload make versions for various UI uses
		var versions = {
			'background': [{
				suffix: 'thumb',
				quality: 90,
				maxHeight: 300,
				maxWidth: 300,
			}],
			'photo': [{
				suffix: 'large',
				quality: 90,
				maxHeight: 1024,
				maxWidth: 1024,
			}, {
				suffix: 'medium',
				quality: 90,
				maxHeight: 480,
				maxWidth: 480
			}, {
				suffix: 'thumb',
				quality: 90,
				maxHeight: 320,
				maxWidth: 320,
				aspect: '1:1'
			}, {
				suffix: 'icon',
				quality: 90,
				maxWidth: 50,
				maxHeight: 50,
				aspect: '1:1'
			}]
		};

		// add uploadable endpoints to MyUser
		uploadable(MyUser, 'MyUser', versions);
	});
};
