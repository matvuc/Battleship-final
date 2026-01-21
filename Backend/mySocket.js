(function (window, $) {
	//Author: Nnamdi Nwanze (adapted)
	//Purpose: Controls the bidirectional sockets of the battleship game
	var myURL = (window && window.BATTLESHIP_SERVER_URL) ? window.BATTLESHIP_SERVER_URL : 'http://127.0.0.1:3000';
	var role = (window && window.PLAYER_ROLE) ? window.PLAYER_ROLE : 'player1';
	var socket;

	function getUsername() {
		if (window && window.gamePlay && typeof window.gamePlay.getUsername === 'function') {
			return window.gamePlay.getUsername();
		}
		return '';
	}

	function initSocket() {
		if (typeof io === 'undefined') return;
		socket = io(myURL, { transports: ['websocket', 'polling'] });

		socket.on('opponent-move', function (data) {
			if (!data || data.role === role) {
				return;
			}
			if (typeof markMiniBoard === 'function') {
				markMiniBoard(data.move, data.status, data.username);
			}
		});
	}

	function emitMove(move, status, usernameOverride) {
		if (!socket) return;
		socket.emit('player-move', {
			role: role,
			move: move,
			status: status,
			username: usernameOverride || getUsername()
		});
	}

	window.battleSocket = {
		emitMove: emitMove
	};

	$(function () {
		initSocket();
	});
})(window, window.jQuery);
