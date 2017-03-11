(function($) {
	function previewUrl(elem) {
		this.element = $(elem);
		var self = this;

		this.target = this.element.data('target');
		this.debug = this.element.data('debug');

		this.lastval = undefined;

		this.start = function() {
			this.element.on('focusout',function() {
				if(self.lastval !== self.element.val()) {
					self.preview(self.element.val());
					self.lastval = self.element.val();
				}
			});
		};

		this.stop = function() {
			this.element.off('focusout');
		};

		this.preview = function(url) {
			var buffer = '<div class="ogPreview last-instantiate" data-jsclass="OgTagPreview" data-src="/api/OgTags/scrape" data-url="' + url + '" data-type="json" data-debug="'+self.debug+'">';
			$(self.target).empty().append(buffer);
			didInjectContent('#url-preview');
		};
	}

	$.fn.previewUrl = GetJQueryPlugin('previewUrl',previewUrl);
})(jQuery);
