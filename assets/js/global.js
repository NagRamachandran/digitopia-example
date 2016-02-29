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
		'enabled': false,
		'disableScrollAnimation': true
	},
};
$('body').digitopiaController(options);
