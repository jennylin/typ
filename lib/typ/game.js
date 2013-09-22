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

Card['2C'] = new Card("club", 2, "2C");
Card['3C'] = new Card("club", 3, "3C");
Card['4C'] = new Card("club", 4, "4C");
Card['5C'] = new Card("club", 5, "5C");
Card['6C'] = new Card("club", 6, "6C");
Card['7C'] = new Card("club", 7, "7C");
Card['8C'] = new Card("club", 8, "8C");
Card['9C'] = new Card("club", 9, "9C");
Card['10C'] = new Card("club", 10, "10C");
Card['JC'] = new Card("club", 11, "JC");
Card['QC'] = new Card("club", 12, "QC");
Card['KC'] = new Card("club", 13, "KC");
Card['AC'] = new Card("club", 14, "AC");
Card['2D'] = new Card("diamond", 2, "2D");
Card['3D'] = new Card("diamond", 3, "3D");
Card['4D'] = new Card("diamond", 4, "4D");
Card['5D'] = new Card("diamond", 5, "5D");
Card['6D'] = new Card("diamond", 6, "6D");
Card['7D'] = new Card("diamond", 7, "7D");
Card['8D'] = new Card("diamond", 8, "8D");
Card['9D'] = new Card("diamond", 9, "9D");
Card['10D'] = new Card("diamond", 10, "10D");
Card['JD'] = new Card("diamond", 11, "JD");
Card['QD'] = new Card("diamond", 12, "QD");
Card['KD'] = new Card("diamond", 13, "KD");
Card['AD'] = new Card("diamond", 14, "AD");
Card['2H'] = new Card("club", 2, "2H");
Card['3H'] = new Card("club", 3, "3H");
Card['4H'] = new Card("club", 4, "4H");
Card['5H'] = new Card("club", 5, "5H");
Card['6H'] = new Card("club", 6, "6H");
Card['7H'] = new Card("club", 7, "7H");
Card['8H'] = new Card("club", 8, "8H");
Card['9H'] = new Card("club", 9, "9H");
Card['10H'] = new Card("club", 10, "10H");
Card['JH'] = new Card("club", 11, "JH");
Card['QH'] = new Card("club", 12, "QH");
Card['KH'] = new Card("club", 13, "KH");
Card['AH'] = new Card("club", 14, "AH");
Card['2S'] = new Card("diamond", 2, "2S");
Card['3S'] = new Card("diamond", 3, "3S");
Card['4S'] = new Card("diamond", 4, "4S");
Card['5S'] = new Card("diamond", 5, "5S");
Card['6S'] = new Card("diamond", 6, "6S");
Card['7S'] = new Card("diamond", 7, "7S");
Card['8S'] = new Card("diamond", 8, "8S");
Card['9S'] = new Card("diamond", 9, "9S");
Card['10S'] = new Card("diamond", 10, "10S");
Card['JS'] = new Card("diamond", 11, "JS");
Card['QS'] = new Card("diamond", 12, "QS");
Card['KS'] = new Card("diamond", 13, "KS");
Card['AS'] = new Card("diamond", 14, "AS");

var Deck52 = exports.Deck52 = function(game) {
  this.game = game;
  this.seed = this.game.seed;
  var suits = ['clubs', 'diamonds', 'hearts', 'spades'];
  var labels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  this.cards = [Card['2C'], Card['3C'], Card['4C'], Card['5C'], Card['6C'], Card['7C'], Card['8C'], Card['9C'], Card['10C'], Card['JC'], Card['QC'], Card['KC'], Card['AC'], Card['2D'], Card['3D'], Card['4D'], Card['5D'], Card['6D'], Card['7D'], Card['8D'], Card['9D'], Card['10D'], Card['JD'], Card['QD'], Card['KD'], Card['AD'], Card['2H'], Card['3H'], Card['4H'], Card['5H'], Card['6H'], Card['7H'], Card['8H'], Card['9H'], Card['10H'], Card['JH'], Card['QH'], Card['KH'], Card['AH'], Card['2S'], Card['3S'], Card['4S'], Card['5S'], Card['6S'], Card['7S'], Card['8S'], Card['9S'], Card['10S'], Card['JS'], Card['QS'], Card['KS'], Card['AS']];
};

Deck52.prototype.shuffle = function() {
  this.cards = _.shuffle(this.cards);
}

Deck52.prototype.deal = function(players, count) {
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

Game.prototype.findPlayerWithCard = function(card) {
  return _.find(this.players, function(player) {
    return _.contains(player.hand, card);
  });
}

Game.prototype.setLeader = function(position) {
  this.leader = position;
}

Game.prototype.onAnswers = function(ids, cb) {
  console.log("on answers .... "+JSON.stringify(ids));
  var game = this;
  var checkAnswers = function() {
    if (_.every(ids, function(id) { return game.questions[id].answered(); })) {
      console.log("all answered! ...")
      cb.apply(game);
    } else {
      console.log("not all answered! ...")
      this.once('processedAnswer', function() {
        console.log("processing answer ...")
        checkAnswers()
      });
    }
  };
  checkAnswers()
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
  question.game = this;
  this.send('question', question.toObject(), question.position);
  _.find(this.moves, function(move) {
    console.log("looking at "+JSON.stringify(move))
    if (move.id == question.id) {
      console.log("question "+question.id+" answered!");
      question.answer(move);
      return true;
    } else {
      return false;
    }
  });
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
