var Knex = require('knex')
  , _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , url = require('url')
  , passwordHash = require('password-hash');

var databaseUrl = url.parse(process.env.DATABASE_URL)
  , databaseHost = databaseUrl.hostname
  , databaseAuth = databaseUrl.auth.split(":", 2)
  , databaseName = databaseUrl.pathname.substring(1);

var db = Knex.Initialize({
  debug: true,
  client: 'pg',
  connection: {
    host     : databaseHost,
    user     : databaseAuth[0],
    password : databaseAuth[1],
    database : databaseName,
    charset  : 'utf8'
  }
});

var Move = exports.Move = function(position, action, createdAt) {
  this.position = position;
  this.action = action;
  this.createdAt = createdAt;
}

var Player = exports.Player = function(game, userId, position, name) {
  this.game = game;
  this.userId = userId;
  this.position = position;
  this.name = name;
  this.hand = [];
};

Player.prototype.receiveCards = function(cards) {
  this.hand = this.hand.concat(cards);
  console.log("player "+this.position+" has "+JSON.stringify(this.hand));
}

var gameFileList = fs.readdirSync(__dirname+'/games');
var games = {};
for (var gameIndex = 0; gameIndex != gameFileList.length; gameIndex++) {
  var name = path.basename(gameFileList[gameIndex], '.js');
  console.log("adding "+gameFileList[gameIndex]+" with name "+name);
  games[name] = require(__dirname+"/games/"+name);
};

var GameManager = module.exports = function() {
  this.db = db;
  this.games = games;
}

GameManager.prototype.listGames = function(cb) {
  if (this.userId === undefined) return cb(null, []);

  this.db('games').select('games.*').
    join('players', 'games.id', '=', 'players.game_id').
    where('games.finished', false).
    where('players.user_id', this.userId).exec(cb);
}

GameManager.prototype.setUserId = function(userId, cb) {
  var manager = this;
  this.userId = userId;
  this.db('users').where('id', userId).exec(function(err, resp) {
    if (err) return cb(err);
    manager.userId = userId;
    cb();
  });
}

GameManager.prototype.createUser = function(name, password, cb) {
  this.db('users').insert({name: name, password: passwordHash.generate(password)}).exec(function(err, resp) {
    if (err) return cb(err);
    cb(null, resp[0]);
  });
}

GameManager.prototype.validateUser = function(name, password, cb) {
  this.db('users').where("name", name).exec(function(err, resp) {
    if (err) return cb(err);
    if (resp[0] && passwordHash.verify(password, resp[0].password)) {
      cb(null, resp[0]);
    } else {
      cb("Not verified");
    }
  });
}

GameManager.prototype.createGame = function(name, cb) {
  var manager = this;
  this.db('games').insert({name: name, user_id: this.userId}).exec(function(err, resp) {
    if (err) return cb(err);
    var game = manager.games[name]();
    game.id = resp[0];
    cb(null, game);
  });
}

GameManager.prototype.joinGame = function(id, position, cb) {
  var manager = this;
  this.loadGame(id, function(err, game) {
    if (err) return cb(err);
    manager.db('players').insert({game_id: id, position: position, user_id: manager.userId}).exec(function(err, resp) {
      if (err) return cb(err);
      cb(null, game);
    });
  });
}

GameManager.prototype.loadGame = function(id, cb) {
  var manager = this;
  this.db('games').where('id', id).exec(function(err, resp) {
    if (err) return cb(err);
    if (!resp[0]) return cb("Game not found for id "+id);
    var gameName = resp[0].name;
    var game = manager.games[gameName]();
    game.id = id;
    manager.addPlayers(game, cb);
  });
}

GameManager.prototype.addPlayers = function(game, cb) {
  var manager = this;
  this.db('players').join('users', 'players.user_id', '=', 'users.id').exec(function(err, players) {
    if (err) return cb(err);
    console.log("players:"+JSON.stringify(players));
    game.players = [];
    players.forEach(function(player) {
      if (player.user_id == manager.userId) {
        game.currentPlayerIndex = player.position;
      }
      game.players[player.position] = new Player(game, player.user_id, player.position, player.name)
    });
    manager.addMoves(game, cb);
  });
};

GameManager.prototype.addMoves = function(game, cb) {
  var manager = this;
  manager.db('moves').where('game_id', game.id).exec(function(err, moves) {
    if (err) return cb(err);
    game.moves = [];
    moves.forEach(function(move) {
      game.moves.push(new Move(move.position, move.action, move.created_at));
    });
    game.play();
    cb(null, game);
  });
};

GameManager.prototype.save = function(game) {
  // todo!
}
