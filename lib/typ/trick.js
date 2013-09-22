var EventEmitter = require('events').EventEmitter;

var Trick = exports.Trick = function(game, opts) {
  this.game = game;
  this.opts = _.extend(opts || {}, {
    trump: false
  });
}

Trick.prototype.validLead = function(cb) {
  this.validLead = cb;
}

Trick.prototype.reset = function() {
  this.lead = null;
}

Trick.prototype.setLead = function(player) {
  this.lead = player;
}

Trick.prototype.play = function(players, cb) {
  var offset = _.indexOf(players, this.lead);
  var trick = this;
  var questionIds = [];
  var askPlayer = function() {
    console.log("passCards "+JSON.stringify(opts));
    var players[offset % 4];
    var question = new MultipleChoiceQuestion("pass cards", offset % 4, game.players[playerIndex].hand, {min: 1, max: 1});
    var questionId = trick.game.askQuestion(question);
    questionIds.push(questionId);
    trick.game.onAnswers([questionId], function() {
      offset++;
      if (offset == players.length) {
        _.flatten(trick.game.questionValues(questionIds))
      } else {
        askPlayer();
      }
    });

  }
}

Trick.prototype.__proto__ = EventEmitter.prototype;
