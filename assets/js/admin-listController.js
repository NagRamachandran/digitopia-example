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
				loadPage('/admin/views/' + self.settings.model + '/add')
			});

			this.element.on('click', '.edit-button', function (e) {
				e.preventDefault();
				var id = $(this).data('id');
				loadPage('/admin/views/' + self.settings.model + '/' + id + '/edit')
			});

			this.element.on('click', '.save-button', function (e) {
				e.preventDefault();
				self.save();
			});

			$(this.element.find('.delete-button')).confirmation({
				placement: 'left',
				'onConfirm': function () {
					self.delete();
				}
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
			this.element.off('click', '.list-button');
			this.element.off('click', '.delete-button');
			this.element.off('click', '.edit-button');
			this.element.off('click', '.add-button');
			this.element.off('click', '.save-button');
			this.element.off('click', '.search-button');
			this.element.off('click', '.instance-select');
		};

		this.delete = function () {
			$.ajax({
					method: 'delete',
					url: self.element.data('endpoint')
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/index')
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					flashAjaxStatus('error', 'Could not delete: ' + textStatus)
				})
		};

		this.save = function () {
			var form = self.element.find('input,textarea,select').serializeArray()
			$.ajax({
					method: 'put',
					url: self.element.data('endpoint'),
					data: form
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/' + data.id + '/view');
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					flashAjaxStatus('error', 'Could not delete: ' + textStatus)
				})
		};
	}

	$.fn.adminListController = GetJQueryPlugin('adminListController', adminListController);

})(jQuery);
