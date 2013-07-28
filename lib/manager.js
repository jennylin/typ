var GameManager = module.exports = function() {
  var Knex = require('knex');

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
  this.db = db;
  this.games = {};
  gameFileList.forEach(function(gameFile) {
    var name = path.basename(gameFile, '.js');
    this.games[name] = gameFile;
  });
}

GameManager.prototype.create = function(name, cb) {
  var record = {name: name};
  this.db('games').insert().exec(function(err, resp) {

  });
}

GameManager.prototype.load = function(id, cb) {
  redis.hgetall("game-"+id, function(err, res) {
    if (err) {
      return cb(err);
    }
    var gameName = res.name;
    if (this.games[gameName] === undefined) {
      return cb("No such game: "+gameName);
    }
    var game = require(this.games[gameName]).makeMoves(JSON.parse(res.moves));
    cb(null, game);
  });
}
