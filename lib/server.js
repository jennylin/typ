var fs = require('fs')
  , path = require('path')
  , express = require('express')
  , partials = require('express-partials')
  , GameManager = require('./manager')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy;

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
  console.log(JSON.stringify(req.session))

  req.gameManager = new GameManager();
  if (req.session.userId && req.session.expiresAt > new Date().getTime()) {
    req.gameManager.setUserId(req.session.userId, function(err) {
      if (err) {
        res.redirect("/login?r="+encodeURIComponent(req.originalUrl));
      } else {
        next();
      }
    })
  } else {
    next();
  }
}

function setupPassport(req, res, next) {
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ACCESS_TOKEN,
    clientSecret: process.env.FACEBOOK_SECRET_TOKEN,
    callbackURL: "http://localhost:4333/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    req.gameManager.validateFBUser({facebookId : profile.id}, function(err, oldUser){
        if(oldUser){
            //done(null,profile);
        }else{
            req.gameManager.createFBUser(profile.displayName, profile.id, function(err, userId) {
                if (err) return res.send(500, err.toString());
                if (userId !== undefined) {
                    req.session.userId = userId;
                    req.session.expiresAt = (new Date().getTime()) + 84600000;
                    res.redirect("/games");
                    done(null, profile);
                }
            });
        }
    });
  }
));
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
  this.app.use(setupPassport);
  this.app.use(passport.initialize());
  this.app.use(passport.session());

  this.app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
  });

  this.app.set('view engine', 'ejs');
  this.app.set('view options', { layout: 'layout' });

  this.app.get('/', function(req, res) {
    res.redirect('/games');
  });

  // start creating account
  this.app.get('/account', function(req, res) {
    res.render('account');
  });

  // create account
  this.app.post('/account', function(req, res) {
    if (req.body.password !== req.body.confirmPassword) {
      return res.render("account", {error: "Passwords must match!"})
    }

    req.gameManager.createUser(req.body.name, req.body.password, function(err, userId) {
      if (err) return res.send(500, err.toString());
      if (userId !== undefined) {
        req.session.userId = userId;
        req.session.expiresAt = (new Date().getTime()) + 84600000;
        res.redirect("/games");
      }
    });
  });

  // login page
  this.app.get('/login', function(req, res) {
    res.render('login');
  });

  // actually login
  this.app.post('/login', function(req, res) {
    req.gameManager.validateUser(req.body.username, req.body.password, function(err, resp) {
      if (err) return res.send(500, err.toString());
      req.session.userId = resp.id;
      req.session.expiresAt = (new Date().getTime()) + 84600000;
      res.redirect("/games");
    })
  });

  // login with fb
  this.app.get('/auth/facebook', passport.authenticate('facebook'));
  this.app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/games', failureRedirect: '/login' }));

  // list games
  this.app.get('/games', authenticate, function(req, res) {
    req.gameManager.listGames(function(err, list) {
      console.log("list:" + JSON.stringify(list))
      if (err) return res.send(500, err.toString());
      res.render('games', { list: list });
    });
  });

  // create new game
  this.app.post('/games', authenticate, function(req, res) {
    req.gameManager.createGame(req.body.name, function(err, game) {
      if (err) return res.send(500, err.toString());
      res.redirect('/games/'+game.id);
    });
  });

  // view game
  this.app.get('/games/:game_id', authenticate, function(req, res) {
    req.gameManager.loadGame(req.params.game_id, function(err, game) {
      if (err) return res.send(err.toString());
      if (game.ready) {
        res.render('game', { game: game });
      } else {
        res.render('join_game', { game: game });
      }
    });
  });

  // view game
  this.app.post('/games/:game_id/join', authenticate, function(req, res) {
    req.gameManager.joinGame(req.params.game_id, req.body.position, function(err, game) {
      if (err) return res.send(err.toString());
      res.redirect("/games/"+game.id);
    });
  });

  // post move to game
  this.app.post('/games/:game_id/moves', authenticate, function(req, res) {
    if (game.players.get(parseInt(req.params.player_id)).makeMove(req.gameManager.userId, req.body.move)) {
      res.send(201);
    } else {
      res.send(400);
    }
  });

  // listen to game events
  this.app.get('/games/:game_id/moves', authenticate, function(req, res) {
    req.gameManager.loadGame(req.params.game_id, function(err, game) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      for (var eventIndex = 0; eventIndex != game.events.length; eventIndex++) {
        var evt = game.events[eventIndex];
        if (evt.allowedFor(game.currentPlayerIndex)) {
          res.write(server.convertEventToServerSent(evt));
        }
      }
      game.on('event', function(evt) {
        console.log("got an event!"+JSON.stringify(evt));
        if (evt.allowedFor(game.currentPlayerIndex)) {
          res.write(server.convertEventToServerSent(evt));
        }
      });
    });
  });
}

HttpServer.prototype.convertEventToServerSent = function(evt) {
  return "id: "+evt.id+"\nevent: "+evt.type+"\ndata: "+JSON.stringify(evt.body)+"\n\n";
}

HttpServer.prototype.start = function() {
  console.log("Starting typ ... on port "+process.env.PORT);
  this.app.listen(parseInt(process.env.PORT));
}
