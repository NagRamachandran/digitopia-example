var async = require('async');

module.exports = function (Upload) {
	// Remove dangling files from s3 before deleting instance
	Upload.observe('before delete', function (ctx, doneObserving) {
		var File = ctx.Model;
		Upload.find({
			where: ctx.where
		}, function (err, files) {

			// for all the Upload intances being deleted
			async.map(files, function (file, doneWithFiles) {

				// delete the files from s3
				async.map(file.imageSet, function (image, doneDeletingS3) {

					Upload.app.models.Container.removeFile(file.bucket, image.key, function (err) {
						doneDeletingS3(err);
					});

				}, function (err, obj) {
					doneWithFiles(err, obj);
				});

			}, function (err, obj) {
				doneObserving(err);
			});
		});
	});
};
