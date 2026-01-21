var fs = require('fs');
var path = require('path');

var config = require('./config.json');

var dataDir = path.resolve(__dirname, 'data');
var dbName = (config && config.myDB) ? String(config.myDB).trim() : 'players';
var dbFile = path.join(dataDir, dbName + '.json');

// defaults and sample scores
var seedPlayers = [
	{ name: 'AdmiralAckbar', score: 12 },
	{ name: 'Joey', score: 9 },
	{ name: 'Naruto', score: 15 }
];

// makes sure directory exists
function ensureDir(cb) {
	fs.mkdir(dataDir, { recursive: true }, function (err) {
		cb(err);
	});
}

// reads db json
function readDb(cb) {
	fs.readFile(dbFile, 'utf8', function (err, content) {
		if (err) {
			if (err.code === 'ENOENT') {
				return cb(null, { players: [] });
			}
			return cb(err);
		}
		try {
			var parsed = JSON.parse(content);
			if (!parsed.players) {
				parsed.players = [];
			}
			return cb(null, parsed);
		} catch (parseErr) {
			return cb(null, { players: [] });
		}
	});
}

// writes db json
function writeDb(payload, cb) {
	var serialized = JSON.stringify(payload, null, 2);
	fs.writeFile(dbFile, serialized, 'utf8', cb);
}

// merges seed scores when missing
function applySeeds(db) {
	var existing = db.players || [];
	seedPlayers.forEach(function (seed) {
		var found = existing.find(function (p) {
			return p && typeof p.name === 'string' && p.name.toLowerCase() === seed.name.toLowerCase();
		});
		if (!found) {
			existing.push({ name: seed.name, score: seed.score });
		}
	});
	db.players = existing;
	return db;
}

// setup database file
function setup(cb) {
	ensureDir(function (err) {
		if (err) return cb(err);
		readDb(function (readErr, db) {
			if (readErr) return cb(readErr);
			var seeded = applySeeds(db);
			writeDb(seeded, function (writeErr) {
				if (writeErr) return cb(writeErr);
				cb(null, { status: 'ready', path: dbFile, players: seeded.players.length });
			});
		});
	});
}

function normalizeName(name) {
	if (typeof name !== 'string') return '';
	var cleaned = name.trim();
	return cleaned;
}

// ensures username exists but doesnt change score
function ensureUser(name, cb) {
	var cleaned = normalizeName(name);
	if (!cleaned) return cb(new Error('Username is required.'));
	readDb(function (err, db) {
		if (err) return cb(err);
		db.players = db.players || [];
		var existing = db.players.find(function (p) {
			return p && p.name && p.name.toLowerCase() === cleaned.toLowerCase();
		});
		if (!existing) {
			db.players.push({ name: cleaned, score: null });
			return writeDb(db, function (writeErr) {
				if (writeErr) return cb(writeErr);
				cb(null, { name: cleaned, score: null });
			});
		}
		return cb(null, existing);
	});
}

// updates score if better, andadds user if missing.
function updateScore(name, moves, cb) {
	var cleaned = normalizeName(name);
	if (!cleaned) return cb(new Error('Username is required.'));
	var numeric = Number(moves);
	if (isNaN(numeric)) return cb(new Error('Invalid moves count.'));

	readDb(function (err, db) {
		if (err) return cb(err);
		db.players = db.players || [];
		var existing = db.players.find(function (p) {
			return p && p.name && p.name.toLowerCase() === cleaned.toLowerCase();
		});
		if (!existing) {
			existing = { name: cleaned, score: numeric };
			db.players.push(existing);
		} else if (existing.score === null || existing.score === undefined || numeric < existing.score) {
			existing.score = numeric;
		}
		writeDb(db, function (writeErr) {
			if (writeErr) return cb(writeErr);
			cb(null, existing);
		});
	});
}

// returns highscores sorted ascending
function getHighscores(cb) {
	readDb(function (err, db) {
		if (err) return cb(err);
		var players = (db.players || []).slice();
		players.sort(function (a, b) {
			if (a.score === null || a.score === undefined) return 1;
			if (b.score === null || b.score === undefined) return -1;
			return a.score - b.score;
		});
		cb(null, players);
	});
}

module.exports = {
	setup: setup,
	ensureUser: ensureUser,
	updateScore: updateScore,
	getHighscores: getHighscores,
	dbFile: dbFile,
	config: config
};
