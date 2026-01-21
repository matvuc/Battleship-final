// pulls highscores from backend and renders into #highscoreTable
(function ($) {
	if (!$) return;

	function getServerBaseUrl() {
		if (typeof window !== 'undefined' && window.BATTLESHIP_SERVER_URL) {
			return String(window.BATTLESHIP_SERVER_URL).trim();
		}
		return 'http://127.0.0.1:3000';
	}

	function renderScores(scores) {
		var $table = $('#highscoreTable tbody');
		if (!$table.length) return;
		$table.empty();
		for (var i = 0; i < scores.length; i++) {
			var row = scores[i];
			var scoreText = (row.score === null || row.score === undefined) ? '—' : row.score;
			var tr = $('<tr></tr>');
			tr.append($('<td></td>').text(row.name || ''));
			tr.append($('<td></td>').text(scoreText));
			$table.append(tr);
		}
	}

	function fetchScores() {
		var base = getServerBaseUrl();
		if (base.charAt(base.length - 1) === '/') {
			base = base.slice(0, -1);
		}
		$.getJSON(base + '/highscores')
			.done(function (res) {
				if (res && res.highscores) {
					renderScores(res.highscores);
				}
			});
	}

	$(function () {
		fetchScores();
	});
})(window.jQuery);
