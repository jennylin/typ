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

  this.db('games').
    join('players', 'games.id', '=', 'players.game_id').
    where('games.finished', false).
    where('players.user_id', this.userId).exec(cb);
}

GameManager.prototype.createUser = function(name, password, cb) {
  this.db('users').insert({name: name, password: passwordHash.generate(password)}).exec(function(err, resp) {
    if (err) return cb(err);
    cb(null, resp[0]);
  });
}

GameManager.prototype.validateUser = function(name, password, cb) {
  this.db('users').select(name, passwordHash.generate(password)).exec(function(err, resp) {
    if (err) return cb(err);
    cb(null, resp[0]);
  });
}

GameManager.prototype.createGame = function(name, cb) {
  var manager = this;
  this.db('games').insert({name: name}).exec(function(err, resp) {
    if (err) return cb(err);
    var game = require("./games/"+manager.games[name])();
    game.id = resp[0];
    cb(null, game);
  });
}

GameManager.prototype.joinGame = function(id, position, cb) {
  this.loadGame(id, function(err, game) {
    if (err) return cb(err);

  })
  this.db('games').insert({name: name}).exec(function(err, resp) {
    if (err) {
      return cb(err);
    }
    var game = require("./games/"+manager.games[name])();
    game.id = resp[0];
    cb(null, game);
  });
}

GameManager.prototype.loadGame = function(id, cb) {
  var manager = this;
  this.db('games').where('id', id).exec(function(err, resp) {
    if (err) return cb(err);
    if (!resp[0]) return cb("Game not found for id "+id);
    var gameName = resp[0].name;
    var game = manager.games[gameName]();
    manager.db('players').where('game_id', id).exec(function(err, playersResponse) {
      manager.db('moves').where('game_id', id).orderBy('id').exec(function(err, resp) {
        if (err) {
          return cb(err);
        }
        var moves = _.map(resp, function(move) {
          return {playerId: move.player_id, action: move.action};
        })
        game.id = id;
        game.play(moves);
        cb(null, game);
      });
    });
  });
}

GameManager.prototype.save = function(game) {
  // todo!
}
