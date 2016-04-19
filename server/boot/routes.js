var getCurrentUser = require('../middleware/context-currentUser');
var ensureLoggedIn = require('../middleware/context-ensureLoggedIn');
var getProcessedImage = require('../lib/getProcessedImage');

module.exports = function (server) {
  var router = server.loopback.Router();

  router.get('/', getCurrentUser(), function (req, res, next) {
    var ctx = req.myContext;
    var currentUser = ctx.get('currentUser');
    res.render('pages/home', {
      'user': currentUser,
      'alert': req.query.alert
    });
  });

  router.get('/register', function (req, res, next) {
    res.render('pages/register');
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
        res.redirect('/?alert=registered,+please+log+in');
      }
    });
  });

  router.get('/upload', getCurrentUser(), ensureLoggedIn(), function (req, res, next) {
    var ctx = req.myContext;
    var currentUser = ctx.get('currentUser');

    res.render('pages/upload', {
      user: currentUser
    });

  });

  server.use(router);
};
