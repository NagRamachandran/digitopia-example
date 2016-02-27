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

  router.post('/register', function (req, res, next) {
    server.models.MyUser.create({
      email: req.body.email,
      password: req.body.password
    }, function (err, user) {
      if (err) {
        res.status('400').send(err);
      }
      else {
        res.render('home', {
          'message': 'user created'
        });
      }
    });
  });

  server.use(router);
};
