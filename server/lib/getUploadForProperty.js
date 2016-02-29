module.exports = function getUploadForProperty(prop, uploads) {
	if (uploads && uploads.length) {
		for (var j = 0; j < uploads.length; j++) {
			if (uploads[j].property === prop) {
				return uploads[j].url;
			}
		}
	}
	return '/images/fpo.jpg';
};
