var fs = require('fs')
  , path = require('path')
  , express = require('express')
  , partials = require('express-partials');

var HttpServer = exports.HttpServer = function() {
  var server = this;

  this.app = express();
  this.app.use(partials());
  this.app.use(express.bodyParser());
  this.app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
  });
  this.app.set('view engine', 'ejs');
  this.app.set('view options', { layout: 'layout' });

  this.app.get('/games', function(req, res) {
    res.render('index', { games: games, _: _ });
  });

  this.app.get('/games/:game_id/players/:player_id', function(req, res) {
    res.render('game', { game: this.games[parseInt(req.params.game_id)], player_id: req.params.player_id });
  });

  this.app.post('/games/:game_id/players/:player_id', function(req, res) {
    if (game.players.get(parseInt(req.params.player_id)).makeMove(req.body.move)) {
      res.send(201);
    } else {
      res.send(400);
    }
  });

  this.app.get('/games/:game_id/players/:player_id/moves', function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    for (var eventIndex = 0; eventIndex != game.events.length; eventIndex++) {
      var evt = game.events[eventIndex];
      if (evt.allowedFor(parseInt(req.params.id))) {
        res.write(server.convertEventToServerSent(evt));
      }
    }
    game.on('events', function(evt) {
      if (evt.allowedFor(parseInt(req.params.id))) {
        res.write(server.convertEventToServerSent(evt));
      }
    });
  });
}

// /games/:id
// /games/:id/players/:player_id

HttpServer.prototype.convertEventToServerSent = function(evt) {
  return "id: "+evt.id+"\nevent: "+evt.type+"\ndata: "+JSON.stringify(evt.body)+"\n\n";
}

HttpServer.prototype.start = function() {
  console.log("Starting typ ... on port 4333");
  this.app.listen(4333);
}