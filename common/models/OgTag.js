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

	// add uploadable behavior
	OgTag.on('attached', function () {
		var versions = {
			'image': [{
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
				suffix: 'icon',
				quality: 90,
				maxWidth: 150,
				maxHeight: 150,
				aspect: '1:1'
			}]
		};
		uploadable(OgTag, 'OgTag', versions);
	});

	// look in OgTag table for url.
	// If not found scrape OG from url.
	// If no image in OG tags, take a screenshot.
	// Save OgTag if needed.
	// Save resized image in s3 if needed.

	OgTag.scrape = function (url, ctx, done) {
		async.waterfall([
				function (cb) {
					// have we seen this page before?
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
				},
				function getContentType(instance, og, cb) {
					if (instance) {
						return cb(null, instance, og); // already have it
					}
					var j = request.jar();
					request({
							'method': 'HEAD',
							'url': url,
							'jar': j
						})
						.on('response', function (response) {
							if (response.statusCode !== 200) {
								var e = new VError('error getting head status code: %s %s', response.statusCode, url);
								return cb(e);
							}
							console.log(response.headers['content-type']);
							og.contentType = response.headers['content-type'];
							cb(null, instance, og);
						})
						.on('error', function (err) {
							var e = new VError(err, 'error getting head');
							return cb(e);
						});
				},
				function getOgTags(instance, og, cb) { // get og tags from page

					if (instance) {
						return cb(null, instance, og); // already have it
					}

					if (og.contentType.match(/^image\//)) {
						og = {
							data: {
								ogImage: {
									url: url
								}
							}
						};

						return cb(null, instance, og); // already have it
					}

					var options = {
						'url': url,
						'headers': {
							'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
						},
						'jar': request.jar()

					};

					ogs(options, function (err, og) {
						if (err) {
							var e = new VError('error getting og tags %s', og.err);
							return cb(e);
						}
						cb(err, instance, og);
					});
				},
				function save(instance, og, cb) { // save scraped og instance in cache

					if (instance) {
						return cb(null, instance, og); // already saved
					}

					OgTag.create({
						url: url,
						ogData: og.data
					}, function (err, instance) {
						if (err) {
							return cb(new VError(err, 'could not save OgTag instance %j %j', url, og));
						}
						cb(null, instance, og);
					});
				},
				function screenshot(instance, og, cb) { // take a screenshot if no image in og tags

					if ((instance && instance.uploads && instance.uploads() && instance.uploads().length) || _.has(og, 'data.ogImage')) { // cached, don't need to do anything
						return cb(null, instance, og, null); // don't need screenshot
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
				function upload(instance, og, screenshot, cb) { // upload resized screenshot or data.ogImage to s3

					console.log(og, screenshot);

					if ((instance && instance.uploads && instance.uploads() && instance.uploads().length) || (!screenshot && !og.data.ogImage)) {
						return cb(null, instance); // don't need to save image
					}

					ctx.args.id = instance.id;
					ctx.req.query = {
						'id': instance.id,
						'localCopy': screenshot,
						'url': og.data.ogImage ? og.data.ogImage.url : null
					};

					OgTag.upload(instance.id, 'image', ctx, function (err, upload) {
						if (err) {
							return cb(new VError(err, 'could not save image', err));
						}

						OgTag.include([instance], 'uploads', function (err, instances) {
							if (err) {
								return cb(new VError(err, 'could not include uploads', err));
							}
							cb(null, instances[0]);
						});
					});
				}
			],
			function (err, instance) {
				if (err) {
					var e = new WError(err, 'OgTag scrape failed');
					console.log(e.toString());
					return done(null, {});
				}
				done(err, instance);
			});
	};

	OgTag.lookup = function (url, ctx, done) {
		async.waterfall([
				function (cb) { // have we seen this page before?

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
