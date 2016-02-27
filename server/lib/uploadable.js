var uuid = require('uuid');
var async = require('async');
var request = require('request');
var loopback = require('loopback');
var server = require('../server');

// where uploads get saved
var bucket = process.env.S3_BUCKET ? process.env.S3_BUCKET : 'uploads';

module.exports = function uploadable(model, instance, property, ctx, next) {
	var loopbackContext = loopback.getCurrentContext();
	var currentUser = loopbackContext.get('currentUser');
	var roles = loopbackContext.get('currentUserRoles');
	var req = ctx.req;
	var res = ctx.res;
	var params = req.query.id ? req.query : req.body;
	var folder = model + '-' + property + '/';

	async.waterfall([
		uploadFile,
		cleanupOldFileInstance,
		saveNewFileInstance
	], function (err, results) {
		next(err, results);
	});

	// do the upload to s3
	function uploadFile(cb) {
		handleUpload(req, function (err, uploadedFile) {
			if (err) {
				var e = new Error('Could not upload file');
				e.errorCode = 500;
				e.details = err;
				return cb(e);
			}
			cb(null, instance, uploadedFile);
		});
	}

	// cleanup old File instance before saving new one
	function cleanupOldFileInstance(instance, uploadedFile, cb) {

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
				var e = new Error('Error deleting old versions of uploadable');
				e.errorCode = 500;
				e.details = err;
				return cb(e);
			}

			cb(null, instance, uploadedFile);
		});
	}

	// create new File instance
	function saveNewFileInstance(instance, uploadedFile, cb) {

		var fileInstance = instance.uploads.build({
			'property': property,
			'name': uploadedFile.name,
			'uploadedFileName': uploadedFile.uploadedFileName ? uploadedFile.uploadedFileName : uploadedFile.name,
			'type': uploadedFile.type,
			'container': uploadedFile.container,
			'url': 'https://' + uploadedFile.container + '.s3.amazonaws.com/' + uploadedFile.name
		});

		fileInstance.save(function (err) {
			if (err) {
				var e = new Error('Could not save File');
				e.errorCode = 500;
				e.details = err;
				return cb(e);
			}
			cb(null, fileInstance);
		});
	}

	// save the upload on s3 using a uuid for the filename
	// if copying from a url use Container.uploadStream
	// if peforming an upload use Container.upload
	function handleUpload(req, doneWithUpload) {
		var loopbackContext = loopback.getCurrentContext();

		// copying url to s3
		if (params.url) {
			var options = {};
			var parts = params.url.split('.');
			var extension = parts[parts.length - 1];
			var newName = uuid.v4() + '.' + extension;
			newName = folder + newName;

			var result = {
				name: newName,
				uploadedFileName: params.url,
				type: '',
				container: bucket
			};

			// create an s3 writer
			var s3Upload = server.models.Container.uploadStream(bucket, newName, options, null);

			s3Upload.on('error', function (e) {
				doneWithUpload(e);
			});

			s3Upload.on('finish', function () {
				doneWithUpload(null, result);
			});

			request(params.url).on('response', function (response) {
				result.type = response.headers['content-type'];
			}).on('error', function (err) {
				doneWithUpload(err);
			}).pipe(s3Upload);
		}
		else {
			// uploading multipart payload to s3

			// compute name for s3 file
			var options = {};

			options.getFilename = function (fileInfo, req) {
				fileInfo.uploadedFileName = fileInfo.name;
				var origFilename = fileInfo.name;
				var parts = origFilename.split('.');
				var extension = parts[parts.length - 1];
				var newName = uuid.v4() + '.' + extension;
				return folder + newName;
			};

			// copy the multipart payload to s3
			req.params.container = bucket;
			server.models.Container.upload(req, res, options, function (err, fileObj) {
				var file;
				if (!err && fileObj && fileObj.files && fileObj.files.uploadedFiles) {
					file = fileObj.files.uploadedFiles[0];
				}
				doneWithUpload(err, file);
			});
		}
	}
};
