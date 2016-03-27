var loopback = require('loopback');
var server = require('../server');
var fs = require('fs');
var uuid = require('uuid');
var async = require('async');
var request = require('request');
var multiparty = require('multiparty');
var mime = require('mime-types');
var Uploader = require('s3-uploader');
var VError = require('verror').VError;
var WError = require('verror').WError;
var log = require('docker-logger')({
	syslog: {
		enabled: true,
		type: 'UDP_META',
		port: 514
	},
	file: {
		enabled: true,
		location: '/var/app/current/working/logs'
	}
});
// where uploads get saved
var bucket = process.env.S3_BUCKET ? process.env.S3_BUCKET : 'site-uploads';
var folder = process.env.S3_FOLDER ? process.env.S3_FOLDER : 'uploads/';
var region = process.env.S3_REGION ? process.env.S3_REGION : 'us-standard';
var endpoint = process.env.S3_ENDPOINT;
var s3BucketEndpoint = process.env.S3_ENDPOINT ? true : false;

module.exports = function () {

	return function uploadableFactory(MyModel, myModelName, versions) {

		// define polymorphic hasMany relationship from MyModel to Upload
		MyModel.hasMany(server.models.Upload, {
			as: 'uploads',
			'polymorphic': {
				foreignKey: 'uploadableId',
				discriminator: 'uploadableType'
			}
		});

		// MySQL: set type of discriminatior property because default
		// in jugglingDB is varchar(512) which is too big to index
		server.models.Upload.dataSource.defineProperty('Upload', 'uploadableType', {
			type: 'string',
			length: 30,
			index: true
		});

		// cleanup the uploads before destroying user
		MyModel.observe('before delete', function (ctx, doneObserving) {
			MyModel.find({
				where: ctx.where,
				include: ['uploads']
			}, function (err, users) {
				async.map(users, function (user, cb) {
					user.uploads.destroyAll(cb);
				}, function (err, obj) {
					doneObserving(err);
				});
			});
		});

		// upload a file and store metadata in an Upload instance for MyModel
		MyModel.upload = function (id, property, ctx, cb) {
			var loopbackContext = loopback.getCurrentContext();

			// process the upload
			MyModel.findById(ctx.args.id, function (err, instance) {
				if (err) {
					return cb(new VError(err, 'error reading %s.%s', MyModelName, ctx.args.id));
				}
				if (!instance) {
					return cb(new VError(err, 'instance not found %s.%s', MyModelName, ctx.args.id));
				}
				uploadable(myModelName, instance, property, ctx, versions, function (err, upload) {
					return cb(err, upload);
				});
			});
		};

		// POST /api/MyModels/me/upload/:property
		// property is the use for the upload eg. 'photo' or 'background' etc.
		// requires:
		// 		req.body.url - url to copy file from
		// 		- or -
		// 		req.body.uploadedFile - multipart file upload payload
		MyModel.remoteMethod(
			'upload', {
				accepts: [{
					arg: 'id',
					type: 'number',
					required: true
				}, {
					arg: 'property',
					type: 'string',
					required: true
				}, {
					arg: 'ctx',
					type: 'object',
					http: {
						source: 'context'
					}
				}],
				http: {
					path: '/:id/upload/:property',
					verb: 'post'
				},
				returns: {
					arg: 'response',
					type: 'object'
				}
			}
		);
	};
};

// uploadable
// ----------
// upload handler used by models that have 'uploadables' relationship
// model: the 'from' model
// instance: the model instance
// property: the upload property eg: 'photo', 'background' etc.
// ctx: the context of the request
// versions: array specifying the resize specs for the upload fileSet

function uploadable(model, instance, property, ctx, versions, next) {
	var loopbackContext = loopback.getCurrentContext();
	var currentUser = loopbackContext.get('currentUser');
	var req = ctx.req;
	var res = ctx.res;
	var params = req.query.id ? req.query : req.body;

	folder = model + '-' + property + '/';

	// steps for processing the request
	async.waterfall([
		getLocalCopy,
		uploadFile,
		cleanupOldUploadInstance,
		saveNewUploadInstance
	], function (err, results) {
		if (err) {
			var e = new WError(err, 'upload failed');
			console.log(e.toString());
			return next(e);
		}
		// success - back to caller
		next(null, results);
	});

	// getLocalCopy: aqcuire the file
	// if params.url get file from remote location
	// else if upload save file
	// callback with path to file
	function getLocalCopy(cb) {
		var localCopy;
		var meta = {};

		// doing a url upload
		if (params.url) {
			meta.filename = params.url;

			var theRequest = request
				.get(params.url)
				.on('error', function (err) {
					cb(new VError(err, 'error loading %s', params.url));
				})
				.on('response', function (response) {
					if (response.statusCode === 200 && response.headers['content-type'].match(/^image\//)) {

						// peek at the response to determine the content-type

						meta.type = response.headers['content-type'];
						var extension = mime.extension(meta.type);
						localCopy = '/tmp/' + uuid.v4() + '.' + extension;

						// create a write stream to save the file
						var write = fs.createWriteStream(localCopy)
							.on('error', function (err) {
								cb(new VError(err, 'error saving %s', localCopy));
							})
							.on('finish', function () {
								// success - continue processing waterfall
								cb(null, localCopy, meta);
							});

						// pipe the request into the file
						theRequest.pipe(write);
					}
					else {
						cb('could not open url ' + response.statusCode);
					}
				});
		}
		else {

			// doing a multipart post upload

			var form = new multiparty.Form();

			var foundUploadedFileInUpload = false;

			form.on('error', function (err) {
				cb(new VError(err, 'error parsing upload'));
			});

			form.on('part', function (part) {
				if (part.name !== 'uploadedFile') {
					return part.resume();
				}

				foundUploadedFileInUpload = true;

				// build a write stream to save the file
				meta.filename = part.filename;
				meta.type = part.headers['content-type'];
				var extension = mime.extension(meta.type);

				localCopy = '/tmp/' + uuid.v4() + '.' + extension;

				var write = fs.createWriteStream(localCopy);

				write.on('error', function (err) {
					cb(new VError(err, 'error saving upload %s', localCopy));
				});

				write.on('finish', function () {
					// we have the file - continue processing waterfall
					cb(null, localCopy, meta);
				});

				part.on('error', function (err) { // read stream error
					cb(new VError(err, 'error reading upload part %s', part.filename));
				});

				// pipe the part into the file
				part.pipe(write);
			});

			form.on('close', function () {
				// if we end up here w/o finding the part named "uploadedFile" bail out
				if (!foundUploadedFileInUpload) {
					cb(new VError('uploadedFile not found in multipart payload'));
				}
			});

			form.parse(req);
		}
	}

	// upload the original file to s3
	// and based on the spec in versions upload as many resized versions as needed
	function uploadFile(localCopy, meta, cb) {
		var client = new Uploader(bucket, {
			aws: {
				region: region,
				path: folder,
				acl: 'public-read',
				accessKeyId: process.env.AWS_S3_KEY_ID,
				secretAccessKey: process.env.AWS_S3_KEY,
				s3BucketEndpoint: s3BucketEndpoint,
				endpoint: endpoint //signatureVersion: 'v3'
			},
			cleanup: {
				original: true,
				versions: true
			},
			original: {
				acl: 'public-read'
			},
			versions: versions
		});

		client.upload(localCopy, {}, function (err, images, uploadmeta) {
			if (err) {
				log.error('error uploading', err);
				cb(new VError(err, 's3 upload failed'));
			}
			else {
				// success - continue processing waterfall
				cb(null, instance, meta, images);
			}
		});
	}

	// cleanup old Upload instance before saving new one
	// Upload handles removing dangling files from s3
	function cleanupOldUploadInstance(instance, meta, images, cb) {

		// match any uploads to the instance for same property
		// also matched any '-cropped' versions of the upload
		var query = {
			and: [{
				or: [{
					'property': property
				}, {
					'property': property + '-cropped'
				}]
			}, {
				'uploadableId': instance.id
			}, {
				'uploadableType': model
			}]
		};

		server.models.Upload.destroyAll(query, function (err, info) {
			if (err) {
				return cb(new VError(err, 'Error deleting old version of uploadable'));
			}

			// success - continue processing waterfall
			cb(null, instance, meta, images);
		});
	}

	// create new Upload instance
	function saveNewUploadInstance(instance, meta, images, cb) {

		var original;
		for (var i = 0; i < images.length; i++) {
			if (images[i].original) {
				original = images[i];
			}
		}

		var fileInstance = instance.uploads.build({
			'property': property,
			'filename': meta.filename,
			'type': meta.type,
			'url': original.url,
			'imageSet': getResizedByType(images),
			'bucket': bucket,
			'key': original.key
		});

		fileInstance.save(function (err) {
			if (err) {
				return cb(new VError(err, 'Error saving Upload instance'));
			}

			// success - continue processing waterfall
			cb(null, fileInstance);
		});
	}
}

// reorganize the array we get back from s3-uploader into an object
// w/properties keyed on the "suffix" for each version defined in versions
//	{
//		'large': { url: 's3 url', other metadata },
//		'medium': { url: 's3 url', other metadata },
//		'thumb': { url: 's3 url', other metadata }
//	}
function getResizedByType(resized) {
	var types = {};
	for (var i = 0; i < resized.length; i++) {
		var type = resized[i].suffix ? resized[i].suffix : 'original';
		types[type] = resized[i];
	}
	return types;
}
