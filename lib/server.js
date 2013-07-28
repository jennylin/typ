var fs = require('fs')
  , path = require('path')
  , express = require('express')
  , partials = require('express-partials')
  , GameManager = require('./manager');

function cookieSessions(name) {
  return function(req, res, next) {
    req.session = req.signedCookies[name] || {};

    res.on('header', function(){
      res.cookie(name, req.session, { signed: true });
    });

    next();
  }
}

function createManager(req, res, next) {
  req.gameManager = new GameManager();
  if (req.session.userId && req.session.expiresAt < new Date().time()) {
    req.gameManager.userId = req.session.userId;
  }
  next();
}

function authenticate(req, res, next) {
  if (req.gameManager.userId === undefined) {
    res.redirect("/login?r="+encodeURIComponent(req.originalUrl));
  } else {
    next();
  }
}

var HttpServer = exports.HttpServer = function() {
  var server = this;

  this.app = express();
  this.app.use(partials());
  this.app.use(express.bodyParser());
  this.app.use(express.cookieParser(process.env.COOKIE_SECRET || 'cookie secret'));
  this.app.use(cookieSessions('sid'));
  this.app.use(createManager);

  this.app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
  });

  this.app.set('view engine', 'ejs');
  this.app.set('view options', { layout: 'layout' });

  this.app.get('/account', function(req, res) {
    res.render('account');
  });

  this.app.post('/account', function(req, res) {
    req.gameManager.createUser(req.body.username, req.body.password, req.body.confirmPassword, function(err, user) {
      if (err) {
        return res.send(500, err.toString());
      }
      if (user) {
        req.session.userId = resp.id;
        req.session.expiresAt = (new Date().getTime() / 1000) + 84600;
        res.redirect("/games");
      }

    });
  });

  this.app.get('/login', function(req, res) {
    res.render('login');
  });

  this.app.post('/login', function(req, res) {
    req.gameManager.validateUser(this.body.username, this.body.password, function(err, resp) {
      if (err) {
        return res.send(500, err.toString());
      }
      if (resp) {
        req.session.userId = resp.id;
      }
    })
  });

  this.app.get('/games', authenticate, function(req, res) {
    manager.list(function(err, list) {
      if (err) {
        return res.send(500, err.toString());
      }
      res.render('index', { list: list });
    });
  });

  this.app.get('/games/:game_id', authenticate, function(req, res) {
    manager.load(req.params.game_id, function(err, game) {
      if (err) {
        return rest.send(err.toString());
      }
      res.render('game', { game: this.games[parseInt()] });
    });
  });

  this.app.post('/games/:game_id/moves', authenticate, function(req, res) {
    if (game.players.get(parseInt(req.params.player_id)).makeMove(req.gameManager.userId, req.body.move)) {
      res.send(201);
    } else {
      res.send(400);
    }
  });

  this.app.get('/games/:game_id/moves', authenticate, function(req, res) {
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