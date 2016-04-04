(function ($) {
	function adminListController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.settings = $.extend({
			model: this.element.data('model')
		}, options || {});

		this.start = function () {
			this.element.on('click', '.list-button', function (e) {
				e.preventDefault();
			});

			this.element.on('click', '.add-button', function (e) {
				e.preventDefault();
			});

			this.element.on('click', '.search-button', function (e) {
				e.preventDefault();
			});
		};

		this.stop = function () {
			this.element.off('click', '.list-button');
			this.element.off('click', '.add-button');
			this.element.off('click', '.search-button');
		};
	}

	$.fn.adminListController = GetJQueryPlugin('adminListController', adminListController);

})(jQuery);
