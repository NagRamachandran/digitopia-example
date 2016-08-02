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

function didInjectContent(element) {
	$('#document-body').trigger('DigitopiaInstantiate');
	$('#document-body').data('digitopiaHijax').hijaxLinks(element);
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
	}, 4000);
}

function getUploadForProperty(prop, uploads, type, fpo) {
	if (uploads && uploads.length) {
		for (var j = 0; j < uploads.length; j++) {
			if (uploads[j].property === prop) {
				if (type) {
					if (uploads[j].imageSet[type]) {
						return uploads[j].imageSet[type];
					}
				}
				return uploads[j];
			}
		}
	}
	if (fpo) {
		return {
			url: '/images/fpo.jpg'
		};
	}
	return null;
}
