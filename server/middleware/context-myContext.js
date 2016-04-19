module.exports = function () {

	function ReqContext() {
		this.data = {};

		this.get = function (key) {
			return this.data[key];
		};

		this.set = function (key, value) {
			this.data[key] = value;
		};

		this.cleanup = function () {
			this.data = {};
		};

		this.dump = function () {
			for (var k in this.data) {
				console.log('context:' + k + '= %j', this.data[k]);
			}
		};
	}

	return function myContext(req, res, next) {
		res.once('finish', function () {
			req.myContext.cleanup();
		});
		req.myContext = new ReqContext();
		req.myContext.set('originalUrl', req.originalUrl);
		req.getCurrentContext = function () {
			return req.myContext;
		};
		next();
	};
};
