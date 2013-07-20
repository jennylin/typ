var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , seed = require('seed-random')
  , _ = require('underscore');

var Card = exports.Card = function(suit, rank, label) {
  this.suit = suit;
  this.rank = rank;
  this.label = label;
}

var Trick = exports.Trick = function(opts) {
  this.opts = _.extend(opts || {}, {
    trump: false
  });
}

Trick.prototype.validLead = function(cb) {
  this.validLead = cb;
}
Trick.prototype.__proto__ = EventEmitter.prototype;

var Deck = exports.Deck = function(game) {
  this.game = game;
  this.seed = this.game.seed;
  var suits = ['clubs', 'diamonds', 'hearts', 'spades'];
  var labels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  this.cards = [];
  for (var i = 0; i <= 3; i++) {
    for (var j = 2; j <= 14; j++) {
      this.cards.push(new Card(suits[i], j, labels[j - 2]));
    }
  }
};

Deck.prototype.shuffle = function() {
  var newCards = [];
  this.originalDeck = [];
  while (this.cards.length != 0) {
    var card = this.cards.splice(Math.floor(this.seed() * this.cards.length), 1)[0];
    newCards.push(card);
    this.originalDeck.push(card);
  }
  this.cards = newCards;
}

Deck.prototype.deal = function(players, count) {
  for (var playerIndex = 0; playerIndex != players.length; playerIndex++) {
    console.log(players.get(playerIndex))
    players.get(playerIndex).receiveCards(this.cards.splice(0, count));
  }
}

var Player = exports.Player = function(id) {
  this.id = id;
  this.hand = [];
};

Player.prototype.receiveCards = function(cards) {
  this.hand = this.hand.concat(cards);
  console.log("player "+this.id+" has "+JSON.stringify(this.hand));
}

Player.prototype.passCards = function(opts, cb) {

}

var Players = exports.Players = function(game) {
  this.game = game;
  this.players = [];
};

Players.prototype.push = function(player) {
  this.players.push(player);
  this.length = this.players.length;
}

Players.prototype.get = function(index) {
  console.log('index '+index)
  return this.players[index];
}

Players.create = function(game, num) {
  var players = new Players(game);
  for (var i = 0; i != num; i++) {
    players.push(new Player(i));
  }
  return players;
}

var Game = exports.Game = function() {
  this.state = 'init';
  this.states = {};
  this.moves = [];
  this.pendingMoves = [];
  this.transitionCounters = {};
  this.seed = seed("random game");
}

Game.prototype.on = function(name, cb) {
  this.states[name] = cb;
}

Game.load = function(file) {
  var game = this;
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    game.loadMoves(JSON.parse(data));
  });
}

Game.prototype.makeMove = function(player, move) {
  game.current
}

Game.prototype.makeMoves = function(moves, callback) {
  this.pendingMoves = this.pendingMoves.concat(moves);
  this.play(callback);
}

Game.prototype.play = function(callback) {
  this.playCallback = callback;
  this.runCurrentState();
}

Game.prototype.transitionCount = function(state) {
  return this.transitionCounters[state] || 0
}

Game.prototype.runCurrentState = function() {
  this.emit('stateChange', this.state);
  if (this.transitionCounters[this.state] === undefined) this.transitionCounters[this.state] = 0;
  this.transitionCounters[this.state]++;
  this.states[this.state].bind(this).call();
}

Game.prototype.setPlayDirection = function(direction) {
  this.playDirection = direction;
}

Game.prototype.transition = function(newState) {
  this.state = newState;
  this.runCurrentState();
}

Game.prototype.__proto__ = EventEmitter.prototype;