var boardXsize = 10;
var boardYsize = 10;
var parser = 2.5;
var vessels = [
  ["Cruiser", 2],
  ["Submarine", 3],
  ["Destroyer", 4],
  ["Battleship", 5]
];

var ship = {
  Name: "",
  Length: 0,
  Orientation: "x", // 'x' horizontal, 'y' vertical
  Hits: 0,
  Positions: [],

  setName: function (name) { this.Name = String(name); },
  getName: function () { return this.Name; },

  setLength: function (len) { this.Length = Number(len); },
  getLength: function () { return this.Length; },

  setOrientation: function (o) { if (o === 'x' || o === 'y') this.Orientation = o; },
  getOrientation: function () { return this.Orientation; }
};

var battleship = {
  Board: [],
  Ships: [],

  // helpers
  letterToIndex: function (letter) {
    return String(letter).toUpperCase().charCodeAt(0) - 65;
  },
  indexToLetter: function (idx) {
    return String.fromCharCode(65 + idx);
  },
  parseCoordinates: function (coordinates) {
    if (Array.isArray(coordinates) && typeof coordinates[0] === 'string') {
      return [Number(coordinates[1]), this.letterToIndex(coordinates[0])];
    }
    if (typeof coordinates === 'string') {
      var col = coordinates.charAt(0);
      var row = Number(coordinates.slice(1));
      return [row, this.letterToIndex(col)];
    }
    if (typeof coordinates === 'object' && coordinates !== null && coordinates.col !== undefined && coordinates.row !== undefined) {
      return [Number(coordinates.row), this.letterToIndex(coordinates.col)];
    }
    return null;
  },

  initialize: function () {
    this.Board = Array.from({ length: boardYsize }, function () {
      return Array.from({ length: boardXsize }, function () { return ''; });
    });
    this.Ships = [];
  },

  // randomCoordinates() -> ["B", 7]
  randomCoordinates: function () {
    var colIndex = Math.floor(Math.random() * boardXsize);
    var colLetter = this.indexToLetter(colIndex);
    var row = Math.floor(Math.random() * boardYsize);
    return [colLetter, row];
  },

  // randomOrientation() -> 'x' or 'y'
  randomOrientation: function () {
    return Math.random() < 0.5 ? 'x' : 'y';
  },

  // canIPlaceShip(coordinates, orientation, size) -> boolean
  canIPlaceShip: function (coordinates, orientation, size) {
    var parsed = this.parseCoordinates(coordinates);
    if (!parsed) return false;
    var row = parsed[0], col = parsed[1];

    // start must be inside board
    if (isNaN(row) || isNaN(col) || row < 0 || row >= boardYsize || col < 0 || col >= boardXsize) return false;

    if (orientation === 'x') {
      var endCol = col + size - 1;
      if (endCol >= boardXsize) return false;
      for (var c = col; c <= endCol; c++) {
        if (this.Board[row][c] !== '') return false;
      }
    } else { // 'y'
      var endRow = row + size - 1;
      if (endRow >= boardYsize) return false;
      for (var r = row; r <= endRow; r++) {
        if (this.Board[r][col] !== '') return false;
      }
    }
    return true;
  },

  // putShip(ship) - place ship randomly; mark board cells with ship initial and record positions
  putShip: function (shipObj) {
    var mark = String(shipObj.getName()).charAt(0).toUpperCase();
    var size = shipObj.getLength();
    var orientation = shipObj.getOrientation();
    var maxAttempts = 1000;
    var attempts = 0;

    while (attempts < maxAttempts) {
      var coords = this.randomCoordinates(); // ["B",7]
      if (this.canIPlaceShip(coords, orientation, size)) {
        var startRow = coords[1];
        var startCol = this.letterToIndex(coords[0]);
        var positions = [];
        if (orientation === 'x') {
          for (var i = 0; i < size; i++) {
            this.Board[startRow][startCol + i] = mark;
            positions.push(this.indexToLetter(startCol + i) + startRow);
          }
        } else {
          for (var j = 0; j < size; j++) {
            this.Board[startRow + j][startCol] = mark;
            positions.push(this.indexToLetter(startCol) + (startRow + j));
          }
        }
        shipObj.Positions = positions.slice(); // strings like "B7"
        shipObj.Hits = 0;
        this.Ships.push(shipObj);
        return true;
      }
      attempts++;
    }
    return false;
  },

  // createShips() - instantiate and place four ships with random orientations
  createShips: function () {
    for (var i = 0; i < vessels.length; i++) {
      var newVessel = Object.create(ship);
      newVessel.setName(vessels[i][0]);
      newVessel.setLength(vessels[i][1]);
      newVessel.setOrientation(this.randomOrientation());
      if (!this.putShip(newVessel)) {
        // if placement failed, reinitialize and restart placement sequence
        this.initialize();
        return this.createShips();
      }
    }
  },

  // getRemoteMove(options) - retrieves a coordinate from the remote service using the requested AJAX API and plays the move.
  getRemoteMove: function (options) {
    options = options || {};
    var method = (options.method || '').toLowerCase();
    var defaultEndpoint = 'http://convers-e.com/battleshipcoord.php';
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
      defaultEndpoint = defaultEndpoint.replace('http://', 'https://');
    }
    var endpoint = options.url || defaultEndpoint;
    var self = this;

    function handleError(message, raw) {
      var details = message || 'An error occurred while retrieving the remote move.';
      if (typeof addMessage === 'function') {
        addMessage(details);
        addMessage('Try the button again or choose another remote move option.');
      }
      if (raw && typeof console !== 'undefined' && typeof console.warn === 'function') {
        var extra;
        if (typeof raw === 'string') {
          extra = raw;
        } else {
          try {
            extra = JSON.stringify(raw);
          } catch (jsonErr) {
            extra = String(raw);
          }
        }
        console.warn('Remote move error response:', extra);
      }
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(details + ' Please try again.');
      }
    }

    function extractCoordinate(payload) {
      var data = payload;
      if (typeof data === 'string') {
        var trimmed = data.trim();
        if (!trimmed) {
          return { error: 'Received an empty response from the server.' };
        }
        try {
          data = JSON.parse(trimmed);
        } catch (err) {
          return { error: 'Unable to parse the server response.' };
        }
      }

      if (data && typeof data === 'object') {
        if (data.error) { return { error: String(data.error) }; }
        if (data.status && data.status !== 'success') {
          return { error: 'Server reported status: ' + data.status };
        }
        var content = data.content || data.payload || data.result || data.data || data.response;
        if (content && typeof content === 'object') {
          data = Object.assign({}, content, data);
        }
        var candidate = null;
        var list = [
          data.coordinate,
          data.coord,
          data.move,
          data.position,
          data.play,
          data.coordinates
        ];
        for (var idx = 0; idx < list.length; idx++) {
          var entry = list[idx];
          if (typeof entry === 'string' && entry.trim()) {
            candidate = entry.trim();
            break;
          }
          if (Array.isArray(entry) && typeof entry[0] === 'string' && entry.length >= 2) {
            candidate = String(entry[0]).trim() + String(entry[1]).trim();
            break;
          }
        }
        if (!candidate) {
          var col = data.col || data.column || data.Col || data.Column || data.xcoordinate || data.x;
          var row = data.row || data.Row || data.r || data.ycoordinate || data.y;
          if (col !== undefined && row !== undefined) {
            candidate = String(col) + String(row);
          }
        }
        if (candidate) {
          if (candidate.length === 1 && (data.row || data.ycoordinate || data.y) !== undefined) {
            candidate = String(candidate) + String(data.row || data.ycoordinate || data.y);
          }
          return { coordinate: String(candidate).trim().toUpperCase() };
        }
      }

      return { error: 'Coordinate not found in server response.' };
    }

    function handleSuccess(payload) {
      var result = extractCoordinate(payload);
      if (result.error) {
        handleError(result.error, payload);
        return;
      }

      var coordinate = result.coordinate;

      // normalize server coordinate formats (e.g., H10, 10H, H-10) to local board indices (A0-J9).
      function normalizeCoordinateForBoard(coord) {
        if (typeof coord !== 'string') {
          return coord;
        }
        var trimmedCoord = coord.trim().toUpperCase();
        var cleaned = trimmedCoord.replace(/\s+/g, '');

        var match = cleaned.match(/^([A-J])[\s,:\-]?(\d{1,2})$/);
        if (!match) {
          var swapped = cleaned.match(/^(\d{1,2})[\s,:\-]?([A-J])$/);
          if (swapped) {
            cleaned = swapped[2] + swapped[1];
            match = cleaned.match(/^([A-J])(\d{1,2})$/);
          }
        }

        if (!match) {
          var letters = cleaned.replace(/[^A-J]/g, '');
          var numbers = cleaned.replace(/[^0-9]/g, '');
          if (letters.length === 1 && numbers.length > 0) {
            cleaned = letters + numbers;
            match = cleaned.match(/^([A-J])(\d{1,2})$/);
          }
        }

        if (!match) {
          return cleaned || trimmedCoord;
        }
        var col = match[1];
        var numericPart = parseInt(match[2], 10);
        if (isNaN(numericPart)) {
          return cleaned;
        }
        if (numericPart >= 1 && numericPart <= 10) {
          numericPart -= 1;
        }
        return col + numericPart;
      }

      var boardCoordinate = normalizeCoordinateForBoard(coordinate);

      if (typeof addMessage === 'function') {
        addMessage('Remote move received: ' + coordinate);
        addMessage('Playing coordinate on board as: ' + boardCoordinate);
      }

      var moveResult = self.makeMove(boardCoordinate);
      if (moveResult === null) {
        handleError('The remote coordinate ' + coordinate + ' is invalid for this board layout.', payload);
        return;
      }

      if (typeof gamePlay !== 'undefined' && typeof gamePlay.isGameOver === 'function') {
        gamePlay.isGameOver();
      }
    }

    if (!method) {
      method = 'fetch';
    }

    if (method === 'xhr') {
      try {
        var request = new XMLHttpRequest();
        request.open('GET', endpoint, true);
        request.onreadystatechange = function () {
          if (request.readyState === 4) {
            if (request.status >= 200 && request.status < 300) {
              handleSuccess(request.responseText);
            } else {
              handleError('The server returned status ' + request.status + '.', request.responseText);
            }
          }
        };
        request.onerror = function () {
          handleError('Network error while using XMLHttpRequest.');
        };
        request.send();
      } catch (xhrErr) {
        handleError('Unable to complete XMLHttpRequest call.', xhrErr && xhrErr.message);
      }
      return;
    }

    if (method === 'jquery') {
      if (typeof window !== 'undefined' && window.jQuery && typeof window.jQuery.get === 'function') {
        window.jQuery.get(endpoint)
          .done(function (data) {
            handleSuccess(data);
          })
          .fail(function (jqXHR, textStatus) {
            var response = jqXHR && jqXHR.responseText ? jqXHR.responseText : '';
            handleError('jQuery.get failed: ' + textStatus + '.', response);
          });
      } else {
        handleError('jQuery is not available for the remote move request.');
      }
      return;
    }

    if (method === 'fetch' && typeof fetch === 'function') {
      fetch(endpoint, { method: 'GET' })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Fetch failed with status ' + response.status);
          }
          return response.text();
        })
        .then(function (text) {
          handleSuccess(text);
        })
        .catch(function (err) {
          handleError(err && err.message ? err.message : 'Fetch request failed.');
        });
      return;
    }

    handleError('Unsupported remote move request method: ' + method + '.');
  },

  // updates model and view
  makeMove: function (coordinates) {
    var parsed = this.parseCoordinates(coordinates);
    if (!parsed) return null;
    var row = parsed[0], col = parsed[1];
    if (isNaN(row) || isNaN(col) || row < 0 || row >= boardYsize || col < 0 || col >= boardXsize) return null;

    var cellVal = this.Board[row][col];
    var cellId = this.indexToLetter(col) + row;
    var cellEl = (typeof document !== 'undefined') ? document.getElementById(cellId) : null;

    // already attacked
    if (cellVal === 'M' || cellVal === 'X') {
      if (typeof addMessage === 'function') {
        addMessage('Already attacked ' + cellId + '.');
      }
      return 'already';
    }

    // miss
    if (cellVal === '') {
      this.Board[row][col] = 'M';
      if (cellEl) {
        removeClass(cellEl, 'hit');
        removeClass(cellEl, 'cruiser');
        removeClass(cellEl, 'submarine');
        removeClass(cellEl, 'destroyer');
        removeClass(cellEl, 'battleship');
        addClass(cellEl, 'miss');
        markBox(cellEl, 'M');
      }
      return 'miss';
    }

    // hit (cellVal is ship initial)
    var shipInitial = cellVal;
    this.Board[row][col] = 'X';
    var hitShip = null;
    for (var s = 0; s < this.Ships.length; s++) {
      if (this.Ships[s].getName().charAt(0).toUpperCase() === shipInitial) {
        hitShip = this.Ships[s];
        break;
      }
    }

    if (cellEl) {
      removeClass(cellEl, 'miss');
      addClass(cellEl, 'hit');
      if (hitShip) {
        var vesselClass = hitShip.getName().toLowerCase();
        addClass(cellEl, vesselClass);
      }
      markBox(cellEl, '');
    }

    if (hitShip) {
      hitShip.Hits = (hitShip.Hits || 0) + 1;
      if (typeof addMessage === 'function') {
        addMessage('Hit ' + hitShip.getName());
      }
      // remove this position from ship.Positions (optional) and check sunk
      var posStr = this.indexToLetter(col) + row;
      var idx = hitShip.Positions.indexOf(posStr);
      if (idx !== -1) { hitShip.Positions.splice(idx, 1); }
      if (hitShip.Hits >= hitShip.getLength()) {
        if (typeof addMessage === 'function') {
          addMessage('You sunk the ' + hitShip.getName());
        }
        if (cellEl) {
          addClass(cellEl, 'sunk');
        }
        return 'sunk';
      }
      return 'hit';
    }

    // fallback
    if (typeof addMessage === 'function') { addMessage('Hit'); }
    return 'hit';
  }
};

// network-aware game model helpers
var gameModel = {
	lastStatus: '',
	reportMove: function (coordinate, status) {
		this.lastStatus = status || '';
		var playerName = (typeof gamePlay !== 'undefined' && typeof gamePlay.getUsername === 'function') ? gamePlay.getUsername() : '';
		var role = (typeof window !== 'undefined' && window.PLAYER_ROLE) ? window.PLAYER_ROLE : 'player1';
		var base = (typeof window !== 'undefined' && window.BATTLESHIP_SERVER_URL) ? window.BATTLESHIP_SERVER_URL : 'http://127.0.0.1:3000';
		if (base.charAt(base.length - 1) === '/') {
			base = base.slice(0, -1);
		}
		var route = base + '/' + role;
		if (typeof jQuery !== 'undefined') {
			jQuery.ajax({
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
		if (typeof battleSocket !== 'undefined' && battleSocket && typeof battleSocket.emitMove === 'function') {
			battleSocket.emitMove(coordinate, status, playerName);
		}
	},

	registerUser: function () {
		var playerName = (typeof gamePlay !== 'undefined' && typeof gamePlay.getUsername === 'function') ? gamePlay.getUsername() : '';
		var base = (typeof window !== 'undefined' && window.BATTLESHIP_SERVER_URL) ? window.BATTLESHIP_SERVER_URL : 'http://127.0.0.1:3000';
		if (base.charAt(base.length - 1) === '/') {
			base = base.slice(0, -1);
		}
		if (!playerName || typeof jQuery === 'undefined') return;
		jQuery.ajax({
			url: base + '/username',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ username: playerName }),
			timeout: 5000
		});
	}
};
