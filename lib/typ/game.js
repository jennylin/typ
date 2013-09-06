var fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , seed = require('seed-random')
  , _ = require('underscore')
  , MultipleChoiceQuestion = require('./question').MultipleChoiceQuestion
  , Move = require('./move');

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

var Card = exports.Card = function(suit, rank, id) {
  this.suit = suit;
  this.rank = rank;
  this.id = id;
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
      this.cards.push(new Card(suits[i], j, labels[j - 2] + suits[i]));
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

var Game = exports.Game = function(name) {
  this.name = name;
  this.states = {};
  this.ready = false;
  this.transcript = [];
  this.events = [];
  this.questions = [];
  this.moves = [];
  this.transitionCounters = {};
  this.seed = seed("random game");
  this.currentMoveIndex = 0;
}

//Game.prototype.processAnswer = function(playerId, answer) {
//  for (var i = 0; i != this.questions.length; i++) {
//    var answer = this.questions[i];
//    if (!answer.answered()) answer.answerWith(playerId, answer);
//  }
//  // loop done, lets talk
//  throw "sorry, no answer "+answer+" for player "+playerId+" expected";
//}

Game.prototype.setPlayerCount = function(n) {
  this.playerCount = n;
}

Game.prototype.passCards = function(opts, cb) {
  console.log("passCards "+JSON.stringify(opts));
  var game = this;
  var questionIds = _.map(this.players, function(player, playerIndex) {
    var question = new MultipleChoiceQuestion("pass cards", playerIndex, game.players[playerIndex].hand, {min: 3, max: 3});
    return game.askQuestion(question);
  });
  this.onAnswers(questionIds, cb);
}

Game.prototype.onAnswers = function(ids, cb) {
  var game = this;
  this.once('processedAnswer', function() {
    if (_.every(ids, function(id) { return game.questions[id].answered(); })) {
      cb();
    } else {
      game.onAnswers(ids, cb);
    }
  });
}

Game.prototype.getPlayer = function(index) {
  return this.players[index % this.players.length];
}

Game.prototype.state = function(name, cb) {
  console.log("defining state for "+name);
  this.states[name] = cb;
}

Game.prototype.answerQuestion = function(questionId, answer) {
  if (this.currentPlayerPosition === undefined) throw "no player defined";
  this.addMove(new Move(questionId, this.currentPlayerPosition, answer, new Date()));
}

Game.prototype.addMove = function(move) {
  this.moves.push(move);
  var q = _.find(this.questions, function(question) {
    return question.answer(move);
  });
  if (q === undefined) throw "question not found "+questionId;
  return q.answered();
}

Game.prototype.play = function() {
  if (this.players.length == this.playerCount) {
    this.ready = true;
    this.transition('init');
  }
}

Game.prototype.askQuestion = function(question) {
  question.id = this.questions.length;
  this.questions.push(question);
  this.send('question', question.toObject(), question.position);
  return question.id;
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
