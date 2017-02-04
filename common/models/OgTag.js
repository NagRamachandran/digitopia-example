var ogs = require('open-graph-scraper');
var async = require('async');
var uploadable = require('../../server/lib/uploadable')();
var webshot = require('webshot');
var _ = require('lodash');
var VError = require('verror').VError;
var WError = require('verror').WError;
var tmp = require('tmp');
var request = require('request');

module.exports = function (OgTag) {

	// add the uploadable behavior to the OgTag model
	// so we can store cached and resized images for the UI
	OgTag.on('attached', function () {
		var versions = {
			'image': [{
				suffix: 'large',
				quality: 90,
				maxHeight: 960,
				maxWidth: 960,
			}]
		};
		uploadable(OgTag, 'OgTag', versions);
	});

	// look in OgTag table for the url
	// If found we are done
	// If not found
	//   Retrieve the the HEAD for the url to determine if it still exists and the content-type
	//   Scrape OG tags from url
	//   If no image found in scraped OG tags, take a screenshot
	//   Save OgTag instance if needed
	//   Save resized image in s3 if needed

	OgTag.scrape = function (url, ctx, done) {
		// we have several async tasks to perform so run it through waterfall
		async.waterfall([
				// have we seen this page before?
				function lookup(cb) {
					OgTag.findOne({
						'where': {
							'url': url
						},
						'include': ['uploads']
					}, function (err, instance) {
						if (err) {
							return cb(new VError(err, 'error reading %s.%s', MyModelName, url));
						}
						cb(err, instance, instance ? instance.ogData : {
							data: {}
						});
					});
				},
				// determine the content-type of the url if not cached
				function getContentType(instance, og, cb) {
					if (instance) {
						return cb(null, instance, og); // already have it
					}
					// need cookies for paywalled sites
					request({
							'method': 'HEAD',
							'url': url,
							'jar': request.jar()
						})
						.on('response', function (response) {
							og.success = response.statusCode === 200 ? true : false;
							og.httpStatusCode = response.statusCode;
							og.data.contentType = response.headers['content-type'];
							cb(null, instance, og);
						})
						.on('error', function (err) {
							console.log(err);
							var e = new VError(err, 'error getting head');
							return cb(e);
						});
				},
				// scrape the og tags from the url if needed
				function getOgTags(instance, og, cb) {

					if (instance) {
						return cb(null, instance, og); // already have it
					}

					if (og && !og.success) {
						return cb(null, instance, og); // link is probably bad
					}

					var contentType = og.data.contentType;

					// if it's an image theres no need to scrape the og tags (they don't exist)
					if (contentType && contentType.match(/^image\//)) {
						og.data = {
							contentType: contentType,
							ogImage: {
								url: url
							}
						};

						return cb(null, instance, og);
					}

					// set up the call to open-graph-scraper (using fork that allows setting "request" options explicitly)
					// for paywalled sites like NYT we need to supply facebooks user agent string and support cookies
					var options = {
						'url': url,
						'headers': {
							'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
						},
						'jar': request.jar(),
						'onlyGetOpenGraphInfo': true
					};

					// call open-graph-scraper
					ogs(options, function (err, og) {
						if (err) {
							var e = new VError('error getting og tags %s', og.err);
							return cb(e);
						}
						og.data.contentType = contentType;
						cb(err, instance, og);
					});
				},
				// save scraped og instance in cache if just scraped
				function save(instance, og, cb) {

					if (instance) {
						return cb(null, instance, og); // already saved
					}

					OgTag.create({
						url: url,
						ogData: og
					}, function (err, instance) {
						if (err) {
							return cb(new VError(err, 'could not save OgTag instance %j %j', url, og));
						}
						cb(null, instance, og);
					});
				},
				// fall back to a screenshot if no image in og tags
				function screenshot(instance, og, cb) {

					if ((instance && instance.uploads && instance.uploads() && instance.uploads().length) || _.has(og, 'data.ogImage')) { // cached, don't need to do anything
						return cb(null, instance, og, null); // don't need screenshot
					}

					if (og && !og.success) {
						return cb(null, instance, og, null); // link is probably bad
					}

					tmp.tmpName(function (err, name) {
						if (err) {
							return cb(new VError(err, 'error getting tmp name for screengrab', url));
						}
						name += '.jpg';
						webshot(url, name, function (err) {
							if (err) {
								return cb(err);
							}
							cb(null, instance, og, name);
						});
					});
				},
				// upload resized screenshot or data.ogImage to s3
				function upload(instance, og, screenshot, cb) {

					if (og && !og.success) {
						return cb(null, instance); // link is probably bad
					}

					if ((instance && instance.uploads && instance.uploads() && instance.uploads().length) || (!screenshot && !og.data.ogImage)) {
						return cb(null, instance); // don't need to save image
					}

					if (_.has(og, 'data.ogImage.url')) {
						if (og.data.ogImage.url.match(/^\/\//)) {
							return cb(null, instance);
						}
					}

					// normally this is called via the api /api/modelname/id/upload
					// but we can also call programatically by setting up the input in ctx
					// if screenshot 'localCopy' will be set otherwise we use the url of the ogImage
					ctx.args.id = instance.id;
					ctx.req.query = {
						'id': instance.id,
						'localCopy': screenshot,
						'url': _.has(og, 'data.ogImage.url') ? og.data.ogImage.url : null
					};

					OgTag.upload(instance.id, 'image', ctx, function (err, upload) {
						if (err) {
							return cb(new VError(err, 'could not save image', err));
						}

						// include the upload instance on the ogTag instance
						OgTag.include([instance], 'uploads', function (err, instances) {
							if (err) {
								return cb(new VError(err, 'could not include uploads', err));
							}
							cb(null, instances[0]);
						});
					});
				}
			],
			// done processing
			function (err, instance) {
				if (err) {
					var e = new WError(err, 'OgTag scrape failed');
					console.log(e.toString());
					return done(null, {});
				}
				done(err, instance);
			});
	};

	// look in OgTag table for url.
	OgTag.lookup = function (url, ctx, done) {
		async.waterfall([
				// have we seen this page before?
				function lookup(cb) {

					OgTag.findOne({
						'where': {
							'url': url
						},
						'include': ['uploads']
					}, function (err, instance) {
						if (err) {
							return cb(new VError(err, 'error reading %s.%s', MyModelName, url));
						}
						cb(err, instance, instance ? instance.data : {});
					});
				}
			],
			// done processing
			function (err, instance) {
				if (err) {
					var e = new WError(err, 'OgTag lookup failed');
					console.log(e.toString());
					return done(e);
				}
				done(err, instance);
			});
	};

	OgTag.remoteMethod(
		'scrape', {
			http: {
				path: '/scrape',
				verb: 'get'
			},
			accepts: [{
				arg: 'url',
				type: 'string',
				required: true,
				http: {
					source: 'query'
				}
			}, {
				arg: 'ctx',
				type: 'object',
				http: {
					source: 'context'
				}
			}],
			returns: {
				arg: 'result',
				type: 'object'
			}
		}
	);

	OgTag.remoteMethod(
		'lookup', {
			http: {
				path: '/lookup',
				verb: 'get'
			},
			accepts: [{
				arg: 'url',
				type: 'string',
				required: true,
				http: {
					source: 'query'
				}
			}, {
				arg: 'ctx',
				type: 'object',
				http: {
					source: 'context'
				}
			}],
			returns: {
				arg: 'result',
				type: 'object'
			}
		}
	);
};
