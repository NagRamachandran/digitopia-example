var Uploader = require('s3-uploader');
var request = require('request');
var async = require('async');
var fs = require('fs');
var uuid = require('uuid');
var mime = require('mime-types')

var server = require('../server');

var map = {};

var bucket = process.env.S3_BUCKET ? process.env.S3_BUCKET : 'site-uploads';
var folder = process.env.S3_FOLDER ? process.env.S3_FOLDER : 'resized/';
var region = process.env.S3_REGION ? process.env.S3_REGION : 'us-east-1';

var classes = ['large', 'medium', 'small', 'thumb'];

module.exports.resize = function getResizedImageSet(source, done) {

	isCached(source, function (err, resized) {
		if (err) {
			return done(err);
		}

		if (resized) {
			return done(null, getResizedByWidth(resized));
		}

		var client = new Uploader(bucket, {
			aws: {
				region: region,
				path: folder,
				acl: 'public-read',
				accessKeyId: process.env.AWS_S3_KEY_ID,
				secretAccessKey: process.env.AWS_S3_KEY
			},
			cleanup: {
				original: true,
				versions: true
			},
			versions: [{
				suffix: '-large',
				quality: 80,
				maxHeight: 1040,
				maxWidth: 1040,
			}, {
				suffix: '-medium',
				maxHeight: 780,
				maxWidth: 780
			}, {
				suffix: '-small',
				maxHeight: 320,
				maxWidth: 320
			}, {
				suffix: '-thumb',
				maxWidth: 64,
				maxHeight: 64,
				crop: {
					x: 20,
					y: 35,
					width: 100,
					height: 100
				}
			}]
		});

		getLocalCopy(source, function (err, localCopy) {
			if (err) {
				return done(err);
			}

			client.upload(localCopy, {}, function (err, images, meta) {
				if (err) {
					console.error(err);
				}
				else {
					cacheIt(source, images, function (err) {
						if (err) {
							return done(err);
						}
						else {
							return done(null, getResizedByWidth(images));
						}
					});
				}
			});
		});
	});
};

function isCached(original, cb) {
	server.models.ImageSet.findOne({
		where: {
			"original": original
		}
	}, function (err, data) {
		if (err) {
			return cb(err);
		}
		else {
			if (!data) {
				return cb(null);
			}
			return cb(null, data.imageSet);
		}
	});
}

function cacheIt(original, value, cb) {
	server.models.ImageSet.findOrCreate({
		where: {
			'original': original
		}
	}, {
		'original': original,
		'imageSet': value
	}, function (err, data, created) {
		if (err) {
			console.log('cacheIt could not cache reference', err);
			return cb(new Error('cacheIt could not cache reference'));
		}
		else {
			cb(null);
		}
	});

}

function getLocalCopy(src, done) {
	var theRequest = request.get(src)
		.on('error', function (err) {
			done(err);
		})
		.on('response', function (response) {
			if (response.statusCode === 200 && response.headers['content-type'].match(/^image\//)) {
				var extension = mime.extension(response.headers['content-type']);
				var localCopy = '/tmp/' + uuid.v4() + '.' + extension;
				theRequest
					.pipe(fs.createWriteStream(localCopy))
					.on('close', function () {
						fs.exists(localCopy, function (exists) {
							if (exists) {
								done(null, localCopy);
							}
							else {
								done('could not open local copy');
							}
						});
					})
					.on('error', function (err) {
						done(err);
					});
			}
			else {
				done('could not open url ' + response.statusCode);
			}
		});
}

function getResizedByWidth(resized) {
	var types = {};
	for (var i = 0; i < resized.length; i++) {
		var type = resized[i].suffix;
		types[type] = resized[i];
	}
	return types;
}
