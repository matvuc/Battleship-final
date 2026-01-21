(function ($) {
	if (!$) {
		return;
	}

	var DEFAULT_SERVER_URL = 'http://127.0.0.1:3000';
	var PLAYER_ROLE = (typeof window !== 'undefined' && window.PLAYER_ROLE) ? window.PLAYER_ROLE : 'player1';

	// finds the available battleship instance if any
	function getBattleshipInstance() {
		if (typeof gamePlay !== 'undefined' && gamePlay.Battleship) {
			return gamePlay.Battleship;
		}
		if (typeof battleship !== 'undefined') {
			return battleship;
		}
		return null;
	}

	function translateStatus(outcome, isGameOver) {
		if (isGameOver) {
			return 'gameover';
		}
		if (!outcome) {
			return '';
		}
		if (outcome === 'miss') {
			return 'missed';
		}
		return outcome;
	}

	// wires up clicks on the visible board
	function attachBoardListener($table) {
		if (!$table || !$table.length) {
			return;
		}
		$table.on('click', 'td', function (event) {
			event.preventDefault();
			var $cell = $(event.target).closest('td');
			if (!$cell.length) {
				return;
			}
			var coordinate = $cell.attr('id');
			if (!coordinate) {
				return;
			}

			var bs = getBattleshipInstance();
			if (bs && typeof bs.makeMove === 'function') {
				var moveOutcome = bs.makeMove(coordinate);
				if (moveOutcome === null && typeof addMessage === 'function') {
					addMessage('Invalid coordinate ' + coordinate + '.');
					return;
				}
				var isOver = (typeof gamePlay !== 'undefined' && typeof gamePlay.isGameOver === 'function') ? gamePlay.isGameOver() : false;
				var status = translateStatus(moveOutcome, isOver);
				sendMoveUpdate(coordinate, status);
			} else {
				markBox($cell[0], 'X');
				if (typeof addMessage === 'function') {
					addMessage('Marked ' + coordinate + '.');
				}
				sendMoveUpdate(coordinate, '');
			}
		});
	}

	// clears message log when requested
	function attachClearMessages($btn) {
		if (!$btn || !$btn.length) {
			return;
		}
		$btn.on('click', function (event) {
			event.preventDefault();
			if (typeof clearMessages === 'function') {
				clearMessages();
			}
		});
	}

	// restarts the gameplay facade if provided
	function attachRestart($btn) {
		if (!$btn || !$btn.length) {
			return;
		}
		$btn.on('click', function (event) {
			event.preventDefault();
			if (typeof gamePlay !== 'undefined' && typeof gamePlay.reset === 'function') {
				gamePlay.reset();
			}
			registerUsername();
		});
	}

	// picks the server base url from globals or defaults
	function getServerBaseUrl() {
		if (typeof window !== 'undefined' && window.BATTLESHIP_SERVER_URL) {
			return String(window.BATTLESHIP_SERVER_URL).trim();
		}
		return DEFAULT_SERVER_URL;
	}

	// builds the player registration endpoint
	function buildUsernameUrl() {
		var base = getServerBaseUrl();
		if (base.charAt(base.length - 1) === '/') {
			base = base.slice(0, -1);
		}
		return base + '/username';
	}

	// registers username to the backend
	function registerUsername(nameOverride) {
		if (typeof gameModel !== 'undefined' && gameModel && typeof gameModel.registerUser === 'function') {
			gameModel.registerUser();
			return;
		}
		var playerName = nameOverride;
		if (!playerName && typeof gamePlay !== 'undefined' && typeof gamePlay.getUsername === 'function') {
			playerName = gamePlay.getUsername();
		}
		if (!playerName) {
			return;
		}
		$.ajax({
			url: buildUsernameUrl(),
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ username: playerName }),
			timeout: 5000
		});
	}

	function buildPlayerRoute() {
		var base = getServerBaseUrl();
		if (base.charAt(base.length - 1) === '/') {
			base = base.slice(0, -1);
		}
		return base + '/' + PLAYER_ROLE;
	}

	function sendMoveUpdate(coordinate, status) {
		if (typeof gameModel !== 'undefined' && gameModel && typeof gameModel.reportMove === 'function') {
			gameModel.reportMove(coordinate, status);
			return;
		}
		var playerName = (typeof gamePlay !== 'undefined' && typeof gamePlay.getUsername === 'function') ? gamePlay.getUsername() : '';
		var route = buildPlayerRoute();
		$.ajax({
			url: route,
			method: 'GET',
			data: {
				username: playerName,
				move: coordinate,
				status: status
			},
			timeout: 6000
		});
	}

	// initializes listeners once the dom is ready
	$(function () {
		var $table = $('#gameTable');
		var $clearBtn = $('#clearBtn');
		var $restartBtn = $('#resetBtn');

		if (typeof gamePlay !== 'undefined' && typeof gamePlay.reset === 'function') {
			gamePlay.reset();
		}

		attachBoardListener($table);
		attachClearMessages($clearBtn);
		attachRestart($restartBtn);
		registerUsername();
	});
})(window.jQuery);
