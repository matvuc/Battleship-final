var http = require('http');
var socketIo = require('socket.io');
var createApp = require('./app');
var dbmgr = require('./dbmgr');
var config = require('./config.json');

var HOST = '127.0.0.1';
var PORT = 3000;
if (config && config.server && config.server.host) {
	HOST = config.server.host;
}
if (config && config.server && config.server.port) {
	PORT = config.server.port;
}

var io;
var server;
var app;

function start() {
	app = createApp();
	server = http.createServer(app);
	io = socketIo(server, {
		cors: {
			origin: '*'
		}
	});
	app.set('io', io);

	io.on('connection', function (socket) {
		socket.on('player-move', function (payload) {
			io.emit('opponent-move', payload);
		});
	});

	dbmgr.setup(function (err, info) {
		if (err) {
			console.warn('Database setup failed', err);
		} else {
			console.log('Database ready at ' + info.path);
		}
		server.listen(PORT, HOST, function () {
			console.log('Battleship server listening at http://' + HOST + ':' + PORT);
		});
	});
}

start();

module.exports = server;
