var express = require('express');
var dbmgr = require('./dbmgr');

module.exports = function () {
	var router = express.Router();
	var moveCounts = {
		player1: {},
		player2: {}
	};

	function bumpCount(role, username) {
		var bucket = moveCounts[role] || {};
		var key = username || 'anonymous';
		if (!bucket[key]) {
			bucket[key] = 0;
		}
		bucket[key] += 1;
		moveCounts[role] = bucket;
		return bucket[key];
	}

	function broadcastMove(req, role, payload) {
		var io = req.app.get('io');
		if (!io) return;
		var eventPayload = {
			role: role,
			move: payload.move,
			status: payload.status,
			username: payload.username
		};
		io.emit('opponent-move', eventPayload);
	}

	function handlePlayerRoute(role) {
		return function (req, res) {
			var username = req.query.username || req.body.username;
			var move = req.query.move || req.body.move;
			var status = req.query.status || req.body.status;

			if (!username) {
				return res.status(400).json({ status: 'error', message: 'Username is required.' });
			}

			var count = bumpCount(role, username);
			broadcastMove(req, role, { move: move, status: status, username: username });

			if (status === 'gameover') {
				return dbmgr.updateScore(username, count, function (err, player) {
					if (err) {
						return res.status(500).json({ status: 'error', message: err.message });
					}
					return res.json({
						status: 'success',
						message: 'Game over recorded.',
						moves: count,
						player: player
					});
				});
			}

			return res.json({
				status: 'success',
				message: 'Move recorded.',
				moves: count,
				move: move,
				role: role
			});
		};
	}

	router.post('/username', function (req, res) {
		var username = req.body.username || '';
		dbmgr.ensureUser(username, function (err, player) {
			if (err) {
				return res.status(400).json({ status: 'error', message: err.message });
			}
			res.json({ status: 'success', player: player });
		});
	});

	router.get('/player1', handlePlayerRoute('player1'));
	router.get('/player2', handlePlayerRoute('player2'));

	router.get('/highscores', function (_req, res) {
		dbmgr.getHighscores(function (err, scores) {
			if (err) {
				return res.status(500).json({ status: 'error', message: err.message });
			}
			res.json({ status: 'success', highscores: scores });
		});
	});

	router.get('/', function (_req, res) {
		res.json({ status: 'ok' });
	});

	return router;
};
