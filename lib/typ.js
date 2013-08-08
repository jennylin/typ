var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , seed = require('seed-random')
  , _ = require('underscore');

var Event = function(type, body, recipient) {
  this.type = type;
  this.body = body;
  this.recipient = recipient;
}

Event.prototype.allowedFor = function(playerId) {
  console.log("checking for playerId:"+playerId);
  console.log("this.recipient:"+JSON.stringify(this.recipient));
  return this.recipient === undefined || this.recipient === playerId;
}

function Question(name, playerId, answers) {
  this.name = name;
  this.playerId = playerId;
  this.answers = answers;
}

Question.prototype.answered = function() {
  return this.answer !== undefined;
}

Question.prototype.process = function() {
  return true;
}

Question.prototype.answerWith = function(playerId, answer) {
  if (this.answered()) throw "question already answered";
  if (this.playerId == playerId) {
    if (this.answers.index(answer) != -1) {
      throw "answer "+answer+" not found";
    }
    this.answer = answer;
    return this.process();
  } else {
    throw "wrong playerId, got "+playerId+" expected"+this.playerId;
  }
}

function QuestionList() {
  this.questions = [];
}

QuestionList.prototype.processAnswer = function(playerId, answer) {
  for (var i = 0; i != this.questions.length; i++) {
    var answer = this.questions[i];
    if (!answer.answered()) answer.answerWith(playerId, answer);
  }
  // loop done, lets talk
  throw "sorry, no answer "+answer+" for player "+playerId+" expected";
}

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
    players[playerIndex].receiveCards(this.cards.splice(0, count));
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

var Game = exports.Game = function(name) {
  this.name = name;
  this.states = {};
}

Game.prototype.setPlayerCount = function(n) {
  var game = this;
  _.times(n, function(index) {
    game.players.push(new Player(this, n))
  });
  return game.players;

}

Game.prototype.passCards = function(opts, cb) {
  console.log("passCards "+JSON.stringify(opts));
  for (var playerIndex = 0; playerIndex != this.players.length; playerIndex++) {
    this.askQuestion(playerIndex, "pass cards", this.players[playerIndex].hand);
  }
}

Game.prototype.getPlayer = function(index) {
  return this.players[index % this.players.length];
}

Game.prototype.state = function(name, cb) {
  console.log("defining state for "+name);
  this.states[name] = cb;
}

Game.prototype.makeMoves = function(moves, callback) {
  this.pendingMoves = this.pendingMoves.concat(moves);
  this.play(callback);
}

Game.prototype.play = function() {
  this.transcript = [];
  this.events = [];
  this.moves = [];
  this.players = [];
  this.pendingMoves = [];
  this.transitionCounters = {};
  this.seed = seed("random game");

  this.transition('init');
}

Game.prototype.askQuestion = function(playerIndex, question, answers) {
  console.log("asking question..."+playerIndex+" question:"+question);
  this.send('question', {label: "question", answers: answers}, playerIndex);
}

Game.prototype.transitionCount = function(state) {
  return this.transitionCounters[state] || 0
}

Game.prototype.runCurrentState = function() {
  if (this.transitionCounters[this.currentState] === undefined) this.transitionCounters[this.currentState] = 0;
  this.transitionCounters[this.currentState]++;
  this.states[this.currentState].bind(this).call();
}

Game.prototype.setPlayDirection = function(direction) {
  this.playDirection = direction;
}

Game.prototype.transition = function(newState) {
  console.log("transitioning to "+ newState+ " from "+this.currentState)
  this.send('information', {name: "state change", from: this.currentState, to: newState});
  this.currentState = newState;
  this.runCurrentState();
}

Game.prototype.send = function(type, body, recipient) {
  var evt = new Event(type, body, recipient);
  evt.id = this.events.length;
  this.events.push(evt);
  this.emit('event', evt);
}

Game.prototype.__proto__ = EventEmitter.prototype;
