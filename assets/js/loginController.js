(function ($) {
	function loginController(elem, options) {
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
						loadPage('/?login');
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
	$.fn.loginController = GetJQueryPlugin('loginController', loginController);
})(jQuery);
