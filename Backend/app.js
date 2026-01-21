var express = require('express');
var routesFactory = require('./routes');

function createApp() {
	var app = express();

	// basic middleware
	app.use(function (_req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		if (_req.method === 'OPTIONS') {
			return res.sendStatus(200);
		}
		next();
	});

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	var routes = routesFactory();
	app.use('/', routes);

	return app;
}

module.exports = createApp;
