var loopback = require('loopback');
var boot = require('loopback-boot');
var i18n = require('i18n');

var app = module.exports = loopback();

// use jade templating language
app.set('views', 'server/views');
app.set('view engine', 'jade');
app.locals.pretty = true;

// expose the running environment name to jade
app.locals.env = app.get('env');
app.locals.getUploadForProperty = require('./lib/getUploadForProperty');
app.locals.moment = require('moment');
app.locals._ = require('lodash');

// localization config
i18n.configure({
  locales: ['en', 'es'],
  cookie: 'locale',
  defaultLocale: 'en',
  directory: './locales',
  fallbacks: {
    'es': 'en'
  },
  autoReload: true,
  updateFiles: false
});
app.use(i18n.init);
app.set('i18n', i18n);

// setup component storage for s3
var ds = loopback.createDataSource({
  connector: require('loopback-component-storage'),
  provider: 'amazon',
  key: process.env.AWS_S3_KEY,
  keyId: process.env.AWS_S3_KEY_ID,
});
var container = ds.createModel('container');
app.model(container, {
  'dataSource': null,
  'public': false
});

// use loopback.context on all routes
app.use(loopback.context());

// use loopback.token middleware on all routes
// setup gear for authentication using cookie (access_token)
// Note: requires cookie-parser (defined in middleware.json)
app.use(loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me',
  searchDefaultTokenKeys: false,
  cookies: ['access_token'],
  headers: ['access_token', 'X-Access-Token'],
  params: ['access_token']
}));

var myContext = require('./middleware/context-myContext')();
app.use(myContext);

// put currentUser in loopback.context on /api routes
var getCurrentUserApi = require('./middleware/context-currentUserApi')();
app.use(getCurrentUserApi);

// use basic-auth for development environment
if (app.get('env') === 'development') {
  var basicAuth = require('./middleware/basicAuth')();
  app.use(basicAuth);
}


app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s (%s) ', baseUrl, app.get('env'));
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
