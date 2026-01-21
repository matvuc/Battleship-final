// add a class when missing
function addClass(element, className) {
	if (!element || !className) return;
	if (element.classList) {
		element.classList.add(className);
		return;
	}
	var classes = element.className ? element.className.split(/\s+/) : [];
	if (classes.indexOf(className) === -1) {
		classes.push(className);
		element.className = classes.join(' ').trim();
	}
}

// strip a class from an element
function removeClass(element, className) {
	if (!element || !className) return;
	if (element.classList) {
		element.classList.remove(className);
		return;
	}
	var classes = element.className ? element.className.split(/\s+/) : [];
	var idx = classes.indexOf(className);
	if (idx !== -1) {
		classes.splice(idx, 1);
		element.className = classes.join(' ').trim();
	}
}

// append a message line to the log
function addMessage(msg) {
	var messages = (typeof document !== 'undefined') ? document.getElementById('messages') : null;
	if (!messages) return;
	var entry = document.createElement('p');
	entry.textContent = String(msg);
	messages.appendChild(entry);
	messages.scrollTop = messages.scrollHeight;
}

// clear the message log
function clearMessages() {
	var messages = (typeof document !== 'undefined') ? document.getElementById('messages') : null;
	if (!messages) return;
	messages.innerHTML = '';
	messages.scrollTop = 0;
}

// mark a board box with text
function markBox(element, mark) {
	if (!element) return;
	changeText(element, mark);
}

// render the username banner
function displayUsername(userName) {
	var container = (typeof document !== 'undefined') ? document.getElementById('username') : null;
	if (!container) return;
	container.textContent = String(userName);
}

function changeText(element, msg) {
	if (element !== null)
		element.innerHTML = msg;
}

// draws opponent move on mini board
function markMiniBoard(coordinate, status, username) {
	if (typeof document === 'undefined') return;
	var board = document.getElementById('miniBoard');
	if (!board || !coordinate) return;
	var cell = board.querySelector('[data-mini="' + coordinate + '"]');
	if (!cell) return;
	var mark = status === 'hit' || status === 'sunk' ? 'X' : 'O';
	cell.textContent = mark;
	if (status === 'sunk') {
		addClass(cell, 'sunk');
	} else if (status === 'hit') {
		addClass(cell, 'hit');
	} else if (status === 'missed') {
		addClass(cell, 'miss');
	}
	if (username && typeof addMessage === 'function') {
		addMessage(username + ' played ' + coordinate + ' (' + status + ')');
	}
}
