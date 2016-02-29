(function ($) {
	function logoutController(elem, options) {
		this.element = $(elem);

		this.start = function () {
			this.element.on('click', function (e) {
				e.preventDefault();
				$.post('/api/MyUsers/logout')
					.done(function () {
						document.location.href = '/';
					})
					.fail(function () {
						alert("error");
					});
			});
		};

		this.stop = function () {

		};
	}
	$.fn.logoutController = GetJQueryPlugin('logoutController', logoutController);
})(jQuery);
