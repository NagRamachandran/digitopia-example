(function ($) {
	function adminListController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.settings = $.extend({
			model: this.element.data('model'),
			searchProperty: this.element.data('search-property')

		}, options || {});

		this.start = function () {
			this.element.on('click', '.list-button', function (e) {
				e.preventDefault();
				loadPage('/admin/views/' + self.settings.model + '/index')
			});

			this.element.on('click', '.add-button', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
			});

			this.element.on('click', '.edit-button', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
				loadPage('/admin/views/' + self.settings.model + '/' + id + '/edit')
			});

			this.element.on('click', '.save-button', function (e) {
				e.preventDefault();
			});

			this.element.on('click', '.delete-button', function (e) {
				e.preventDefault();
				alert('delete');
			});

			this.element.on('click', '.search-button', function (e) {
				e.preventDefault();
				var q = self.element.find('[name="q"]').val();
				var query = {
					'property': self.settings.searchProperty,
					'q': q
				};
				loadPage(document.location.pathname + '?' + $.param(query));
			});

			this.element.on('click', '.instance-select', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
				loadPage('/admin/views/' + self.settings.model + '/' + id + '/view')
			});
		};

		this.stop = function () {
			this.element.off('click', '.add-button');
			this.element.off('click', '.search-button');
			this.element.off('click', '.instance-select');
		};
	}

	$.fn.adminListController = GetJQueryPlugin('adminListController', adminListController);

})(jQuery);
