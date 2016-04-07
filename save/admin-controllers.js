(function ($) {
	function adminEditController(elem, options) {
		this.element = $(elem);

		var self = this;

		this.settings = $.extend({
			model: this.element.data('model'),
			searchProperty: this.element.data('search-property'),
			endpoint: this.element.data('endpoint'),
			mode: this.element.data('mode')
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
					url: self.settings.endpoint
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/index');
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					var error = jqXHR.responseText;
					flashAjaxStatus('error', 'Could not delete: ' + error);
				})
		};

		this.save = function () {
			var form = self.element.find('input,textarea,select').serializeJSON({
				checkboxUncheckedValue: 'false',
				parseBooleans: true
			});

			var method = self.settings.mode === 'edit' ? 'put' : 'post';

			flashAjaxStatus('info', 'saving...');

			$.ajax({
					method: method,
					url: self.settings.endpoint,
					data: form
				}).done(function (data) {
					loadPage('/admin/views/' + self.settings.model + '/' + data.id + '/view');
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					var response = JSON.parse(jqXHR.responseText);
					flashAjaxStatus('danger', 'Could not ' + method + 'instance: ' + response.error.message);
				})
		};
	}

	$.fn.adminEditController = GetJQueryPlugin('adminEditController', adminEditController);

})(jQuery);

(function ($) {
	function adminLoginController(elem, options) {
		this.element = $(elem);

		var self = this;
		this.start = function () {
			this.element.on('submit', function (e) {
				e.preventDefault();
				$.post('/api/MyUsers/login', {
						'email': self.element.find('[name="email"]').val(),
						'password': self.element.find('[name="password"]').val()
					})
					.done(function () {
						loadPage('/admin?login');
						didLogIn();
					})
					.fail(function () {
						flashAjaxStatus('error', 'login failed');
					});
			});
		};

		this.stop = function () {
			this.element.off('submit');
		};
	}
	$.fn.adminLoginController = GetJQueryPlugin('adminLoginController', adminLoginController);
})(jQuery);

(function ($) {
	function adminLogoutController(elem, options) {
		this.element = $(elem);
		var self = this;
		this.start = function () {
			this.element.on('click', function (e) {
				e.preventDefault();
				$.post('/api/MyUsers/logout')
					.done(function () {
						loadPage('/admin?logout');
						didLogOut();
					})
					.fail(function () {
						alert("error");
						didLogOut();
					});
			});
		};

		this.stop = function () {
			this.element.off('click');
		};
	}
	$.fn.adminLogoutController = GetJQueryPlugin('adminLogoutController', adminLogoutController);
})(jQuery);
