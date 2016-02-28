var async = require('async');

var bucket = process.env.S3_BUCKET ? process.env.S3_BUCKET : 'site-uploads';

module.exports = function (Upload) {
	Upload.observe('before delete', function (ctx, doneObserving) {
		var File = ctx.Model;
		Upload.find({
			where: ctx.where
		}, function (err, files) {
			async.map(files, function (file, doneDeletingS3) {
				Upload.app.models.Container.removeFile(bucket, file.name, function (err) {
					doneDeletingS3(err);
				});
			}, function (err, obj) {
				doneObserving(err);
			});
		});
	});
};
