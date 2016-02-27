var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.set('views', 'server/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
app.locals.env = app.get('env');

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

// use context middleware
app.use(loopback.context());

// use loopback token middleware
// setup gear for authentication using cookies (access_token)
// for web pages and api
app.use(loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me',
  searchDefaultTokenKeys: false,
  cookies: ['access_token'],
  headers: ['access_token', 'X-Access-Token'],
  params: ['access_token']
}));

var getCurrentUserApi = require('./middleware/context-currentUserApi')();
app.use(getCurrentUserApi);

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
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
