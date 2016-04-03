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
