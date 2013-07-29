var Knex = require('knex')
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

GameManager.prototype.listGames = function() {
  //this.db('')
  //select * from games where games.id = players.id and players.user_id = ? and games.finished = false
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
  this.db('games').insert({name: name}).exec(function(err, resp) {
    if (err) {
      return cb(err);
    }
    var game = require(this.games[name]);
    game.id = resp[0];
    cb(null, game);
  });
}

GameManager.prototype.load = function(id, cb) {
  this.db('games').where('id', id).exec(function(err, resp) {
    if (err) {
      return cb(err);
    }
    if (resp[0]) {
      this.db('moves').where('game_id', id).orderBy('id asc').exec(function(err, resp) {
        if (err) {
          return cb(err);
        }
        var moves = _.map(resp, function(move) {
          return {playerId: move.player_id, action: move.action};
        })
        var game = require(this.games[name]);
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