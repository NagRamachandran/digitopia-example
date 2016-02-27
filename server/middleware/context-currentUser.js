var loopback = require('loopback');

module.exports = function () {
	return function contextCurrentUser(req, res, next) {
		if (!req.accessToken) {
			return next();
		}

		req.app.models.MyUser.findById(req.accessToken.userId, function (err, user) {

			if (err) {
				return next(err);
			}

			if (!user) {
				//user not found for accessToken, which is odd.
				return next();
			}

			req.app.models.Role.getRoles({
				principalType: req.app.models.RoleMapping.USER,
				principalId: user.id
			}, function (err, roles) {

				var loopbackContext = loopback.getCurrentContext();
				loopbackContext.set('currentUser', user);
				loopbackContext.set('ip', req.ip);
				loopbackContext.set('currentUserRoles', roles);
				next();
			});
		});
	};
};
