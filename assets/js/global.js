(function ($) {
	var options = {
		'coverResize': false,
		'geometry': {
			'enabled': true,
			breakpoints: [{
				className: 'digitopia-xsmall',
				maxWidth: 768
			}, {
				className: 'digitopia-small',
				maxWidth: 992
			}, {
				className: 'digitopia-medium',
				maxWidth: 1200
			}, {
				className: 'digitopia-large',
				maxWidth: undefined
			}, ],
		},
		'hijax': {
			'enabled': true,
			'disableScrollAnimation': true
		},
	};

	$('body').digitopiaController(options);

})(jQuery);

function loadPage(href) {
	$('body').trigger('DigitopiaLoadPage', href);
}

function getAccessToken() {
	return $.cookie('access_token');
}

function didLogIn() {
	var current = getAccessToken();
	$('#document-body').removeClass('is-logged-out').addClass('is-logged-in');
}

function didLogOut() {
	$('#document-body').removeClass('is-logged-in').addClass('is-logged-out'); // css login status rules
	$.removeCookie('access_token');
}

(function ($) {
	if (getAccessToken()) {
		didLogIn();
	}
	else {
		didLogOut();
	}
})(jQuery);

function flashAjaxStatus(level, message) {

	var alert = '<div class="alert alert-' + level + '">' + message + '</div>';

	$('#ajax-status').empty().html(alert);

	setTimeout(function () {
		$('#ajax-status').empty();
	}, 2000);
}
