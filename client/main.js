(function(window, $) {
  GameClient = window.GameClient = function(game, $board, $questions) {
    this.game = game;
    this.$board = $board;
    this.$questions = $questions;
    this.moveQueue = [];
    this.init();
  };

  _.extend(GameClient.prototype, {
    questionTemplate: _.template('<p><%- player %></p><p><%- description %></p>'),

    init: function() {
      this.game.client = this;

      this.$board.on('click', '*[jsonpath]', _.bind(this.toggleAnswer, this));
      this.$questions.on('click', '#submit', _.bind(this.submit, this));
    },

    refresh: function(html) {
      if (this.display) {
        _.each(this.display, function(fn, rule) {
          html.find(rule).each(function() {
            $(this).html(fn.call(this, $(this)));
          });
        });
      }
      this.queue(function() {
        this.$board.html(html);
      });
    },

    $: function() {
      return this.$board.find.apply(this.$board, arguments);
    },

    /*
    atJsonpath: function(path) {
      return this.$('[jsonpath="' + path + '"]');
    },
    */

    atJsonpath: function(path) {
      return this.$(path
                    .replace('$.', 'board > ')
                    .replace(/\./g, ' > ')
                    .replace(/\[(\d+)\]/g, function(match, n) { return ':nth-of-type(' + (1+parseInt(n, 10)) + ')'; })
                   );
    },

    move: function(from, to, dom) {
      $dom = $('<div>').html(dom);
      if (this.display) {
        _.each(this.display, function(fn, rule) {
          $dom.find(rule).each(function() {
            $(this).html(fn.call(this, $(this)));
          });
        });
      }
      dom = $dom.html();

      this.queue(function() {
        var client = this;
        var $from = this.atJsonpath(from)
        , $to = this.atJsonpath(to);
        if ($from.length && $to.length) {
          $from.css({
            position: 'absolute',
            left: $from.position().left,
            top: $from.position().top
          })
            .addClass('game-moving')
            .animate({
              left: $from.position().left + $to.offset().left - $from.offset().left,
              top: $from.position().top + $to.offset().top - $from.offset().top
            }, 200, function() {
              $from.remove();
              $to.append(dom);
              client.runQueue();
            });
        } else {
          console.log('could not move');
          $from.remove();
          $to.append(dom);
          client.runQueue();
        }
      });
    },

    queue: function(fn) {
      this.moveQueue.push(fn);
    },

    runQueue: function() {
      if (this.moveQueue.length) {
        this.moveQueue.shift().call(this);
      }
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
      this.runQueue();
    },

    clearAnswers: function() {
      this.answers = [];
      if (!this.question.continuation) {
        this.$board.find('.selected').removeClass('selected');
      }
    }
  });
}(window, jQuery));
