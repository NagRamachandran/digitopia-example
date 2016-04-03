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
					});
			});
		};

		this.stop = function () {
			this.element.off('click');
		};
	}
	$.fn.adminLogoutController = GetJQueryPlugin('adminLogoutController', adminLogoutController);
})(jQuery);
