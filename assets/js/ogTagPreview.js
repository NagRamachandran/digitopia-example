(function ($) {
	function OgTagPreview(elem, options) {
		this.element = $(elem);
		var self = this;

		self.url = this.element.data('url');

		this.start = function () {
			this.element.on('data', function (e, data) {
				self.data = data.result;
				var src = getUploadForProperty('image', data.result.uploads, 'medium', true).url;
				var img = $('<img data-jsclass="digitopiaLazyImg" data-lazy-src="' + src + '">');
				var caption = $('<div class="caption">');
				var site = data.result.ogData.ogSiteName ? data.result.ogData.ogSiteName : parseUri(self.url).host;
				var title = data.result.ogData.ogTitle ? data.result.ogData.ogTitle : 'Link'
				if (data.result.ogData.contentType && data.result.ogData.contentType.match(/^image\//i)) {
					title = "Image";
				}
				caption.append('<h3>' + title + '<i class="glyphicon glyphicon-chevron-right"></i></h3>');
				if (data.result.ogData.ogDescription) {
					caption.append('<h4>' + data.result.ogData.ogDescription + '</h4>');
				}
				caption.append('<small><em>' + site + '</em></small>');
				caption.append('</div>');
				self.element.append(img);
				self.element.append(caption);
				if (data.result.ogData.ogVideo) {
					self.element.append('<div class="play"><i class="glyphicon glyphicon-play-circle"></i></div>');
				}
				self.element.digitopiaViewport({
					'crop': true,
					'blowup': true
				});
				didInjectContent(self.element);
			});

			self.element.digitopiaAjax({
				args: {
					url: self.url
				}
			});

			self.element.on('click', function (e) {
				if (self.data && self.data.ogData.ogVideo) {
					self.element.empty().append('<iframe width="100%" height="100%" src="' + self.data.ogData.ogVideo.url + '?autoplay=1" frameborder="0" allowfullscreen></iframe>')
				}
				else {
					var ref = window.open(self.url, '_blank');
				}
			});

			self.element.on('mouseenter', function () {
				self.element.addClass('hovering');
			});
			self.element.on('mouseleave', function () {
				self.element.removeClass('hovering');
			});
		};

		self.stop = function () {
			this.element.off('data');
			this.element.off('click');
		};
	}
	$.fn.OgTagPreview = GetJQueryPlugin('OgTagPreview', OgTagPreview);
})(jQuery);
