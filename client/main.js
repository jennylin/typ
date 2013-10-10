(function(window, $) {
  GameClient = window.GameClient = function(game, $board, $questions) {
    this.game = game;
    this.$board = game.dom = $board;
    this.$questions = $questions;
    this.init();
  };

  _.extend(GameClient.prototype, {
    questionTemplate: _.template('<p><%- player %></p><p><%- description %></p>'),

    init: function() {
      this.game.client = this;

      this.$board.on('click', '*[jsonpath]', _.bind(this.toggleAnswer, this));
      this.$questions.on('click', '#submit', _.bind(this.submit, this));
    },

    toggleAnswer: function(e) {
      var answer = $(e.currentTarget).attr('jsonpath');
      if (_.contains(this.question.options, answer)) {
        e.stopPropagation();
        if (_.contains(this.answers, answer)) {
          $(e.currentTarget).removeClass('selected');
          this.answers = _.without(this.answers, answer);
        } else {
          $(e.currentTarget).addClass('selected');
          this.answers.push(answer);
          if (!this.question.multiple) {
            this.submit();
          }
        }
      }
    },

    submit: function() {
      //try {
        this.game.answer({ id: this.question.id, answer: this.answers });
/*
      } catch(err) {
        console.log(err);
        this.clearAnswers();
      }
*/
      return false;
    },

    ask: function(player, question) {
      this.question = question;
      this.clearAnswers();
      this.$questions.html(this.questionTemplate({
        player: player.name,
        description: question.description,
      }));
      if (question.multiple) {
        this.$questions.append('<a href="#" id="submit">Done</a>');
      }
    },

    clearAnswers: function() {
      this.answers = [];
      if (!this.question.continuation) {
        this.$board.find('.selected').removeClass('selected');
      }
    }
  });
}(window, jQuery));
