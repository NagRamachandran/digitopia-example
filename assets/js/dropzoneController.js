(function ($) {
	Dropzone.autoDiscover = false;

	function dropzoneController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.settings = $.extend({
			endpoint: this.element.data('endpoint')
		}, options || {});

		this.dropzone = undefined;

		this.start = function () {
			this.dropzone = new Dropzone(this.element[0], {
				url: self.settings.endpoint,
				paramName: 'uploadedFile',
				uploadMultiple: false,
				maxFiles: 1,

				init: function () {

					this.on('maxfilesexceeded', function (file) {
						this.removeAllFiles();
						this.addFile(file);
					});

					this.on("processing", function () {
						self.element.addClass('loading');
					});

					this.on("success", function (dzfile, body) {
						var response = body.response;
						var s3file = response.url;
						var img = self.element.parent().find('img').first();
						img.attr('src', '');
						img.attr('src', s3file);
						self.element.removeClass('loading');
					});

					this.on("complete", function (file) {
						this.removeFile(file);
					});
				}
			});
		};

		this.stop = function () {};
	}

	$.fn.dropzoneController = GetJQueryPlugin('dropzoneController', dropzoneController);
})(jQuery);
