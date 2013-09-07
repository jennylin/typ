var _ = require('underscore')

var MultipleChoiceQuestion = exports.MultipleChoiceQuestion = function(label, position, answers, options) {
  this.label = label;
  this.position = position;
  this.answers = answers;
  this.options = _.defaults(options, {min: 1, max: 1});
  this.createdAt = new Date();
}

MultipleChoiceQuestion.prototype.toObject = function() {
  return { label: this.label, type: "multiple", position: this.position, id: this.id,
    answers: this.answers, min: this.options.min, max: this.options.max };
}

MultipleChoiceQuestion.prototype.answer = function(move) {
  console.log("answering with "+JSON.stringify(move)+ " for "+JSON.stringify(this.toObject()))
  if (!this.answered() && move.id === this.id) {
    console.log("answered!")
    this.move = move;
    this.game.emit('processedAnswer');
    return true;
  } else {
    console.log("not answered!")
    return false;
  }
}

MultipleChoiceQuestion.prototype.answered = function() {
  return this.move !== undefined;
}
