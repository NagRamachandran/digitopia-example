var loopback = require('loopback');

module.exports = function () {
	return function contextCurrentUser(req, res, next) {
		if (!req.accessToken) {
			return next();
		}

		req.app.models.MyUser.findById(req.accessToken.userId, {
			include: ['uploads']
		}, function (err, user) {

			if (err) {
				return next(err);
			}

			if (!user) {
				// user not found for accessToken, which is very odd.
				// behave like they are not logged in
				return next();
			}

			req.app.models.Role.getRoles({
				principalType: req.app.models.RoleMapping.USER,
				principalId: user.id
			}, function (err, roles) {

				var reqContext = req.getCurrentContext();
				reqContext.set('currentUser', user);
				reqContext.set('ip', req.ip);
				reqContext.set('currentUserRoles', roles);
				next();
			});
		});
	};
};
