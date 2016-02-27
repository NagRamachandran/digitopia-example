var getCurrentUser = require('../middleware/context-currentUser');
module.exports = function (server) {
  var router = server.loopback.Router();

  router.get('/', getCurrentUser(), function (req, res, next) {
    var ctx = server.loopback.getCurrentContext();
    var currentUser = ctx.get('currentUser');
    res.render('home', {
      'user': currentUser
    });
  });

  server.use(router);
};
