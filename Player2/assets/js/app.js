var gamePlay = {
	Battleship: (typeof battleship !== 'undefined') ? battleship : null,
	gameOver: false,

	// pulls the username from the query string
	getUsername: function () {
		if (typeof window === 'undefined') return '';
		var params = new URLSearchParams(window.location.search);
		var name = params.get('username');
		return name ? String(name) : '';
	},

	// prepares the board and greets the user
	playGame: function () {
		if (typeof battleship !== 'undefined') {
			this.Battleship = battleship;
		}
		if (!this.Battleship) return;
		if (typeof this.Battleship.initialize === 'function') {
			this.Battleship.initialize();
		}
		if (typeof this.Battleship.createShips === 'function') {
			this.Battleship.createShips();
		}
		this.gameOver = false;
		this._displayUsername();
		if (typeof addMessage === 'function') {
			var name = this.getUsername();
			var startMsg = name ? 'Good luck, ' + name + '!' : 'Game started.';
			addMessage(startMsg);
		}
	},

	// checks if all ships have been sunk
	isGameOver: function () {
		if (!this.Battleship || !Array.isArray(this.Battleship.Ships) || this.Battleship.Ships.length === 0) {
			return false;
		}
		var allSunk = this.Battleship.Ships.every(function (shipObj) {
			if (!shipObj || typeof shipObj.getLength !== 'function') return false;
			var hits = shipObj.Hits || 0;
			return hits >= shipObj.getLength();
		});
		if (allSunk && !this.gameOver && typeof addMessage === 'function') {
			addMessage('Game over.');
			this.gameOver = true;
		}
		return allSunk;
	},

	// clears the board and restarts
	reset: function () {
		this._resetBoardView();
		if (typeof clearMessages === 'function') {
			clearMessages();
		}
		this.playGame();
	},

	// removes any previous board styling
	_resetBoardView: function () {
		if (typeof document === 'undefined') return;
		var cells = document.querySelectorAll('#gameTable td');
		Array.prototype.forEach.call(cells, function (cell) {
			removeClass(cell, 'hit');
			removeClass(cell, 'miss');
			removeClass(cell, 'sunk');
			removeClass(cell, 'cruiser');
			removeClass(cell, 'submarine');
			removeClass(cell, 'destroyer');
			removeClass(cell, 'battleship');
			cell.style.backgroundImage = '';
			cell.style.backgroundColor = '';
			changeText(cell, '');
		});
	},

	// updates the username display element
	_displayUsername: function () {
		if (typeof displayUsername !== 'function') return;
		var name = this.getUsername();
		displayUsername(name || '');
	}
};
