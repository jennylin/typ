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
  games[name] = gameFileList[gameIndex];
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
    if (err) {
      return cb(err);
    }
    cb(null, resp[0]);
  });
}

GameManager.prototype.createGame = function(name, cb) {
  var manager = this;
  this.db('games').insert({name: name}).exec(function(err, resp) {
    if (err) {
      return cb(err);
    }
    var game = require("./games/"+manager.games[name]);
    game.id = resp[0];
    cb(null, game);
  });
}

GameManager.prototype.loadGame = function(id, cb) {
  var manager = this;
  this.db('games').where('id', id).exec(function(err, resp) {
    if (err) {
      return cb(err);
    }
    if (resp[0]) {
      manager.db('moves').where('game_id', id).orderBy('id').exec(function(err, resp) {
        if (err) {
          return cb(err);
        }
        var moves = _.map(resp, function(move) {
          return {playerId: move.player_id, action: move.action};
        })
        var game = require("./games/"+manager.games[name]);
        game.id = resp[0];
        game.play(moves);
        cb(null, game);
      });
    } else {
      cb("Can't find game for "+id);
    }
  });
}

GameManager.prototype.save = function(game) {
  // todo!
}