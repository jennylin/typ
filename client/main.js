(function(window, $) {
  GameClient = window.GameClient = function(game, $board, $questions) {
    this.game = game;
    this.$board = $board;
    this.$questions = $questions;
    this.queued = [];
    this.player = null;
    this.init();
  };

  _.extend(GameClient.prototype, {
    questionTemplate: _.template('<p><%- player %></p><p><%- description %></p>'),

    init: function() {
      this.game.client = this;

      this.$board.on('click', '*[jsonpath]', _.bind(this.toggleAnswer, this));
      this.$questions.on('click', '#submit', _.bind(this.submit, this));
    },

    refresh: function() {
      var html = this.game.dom(this.player);
      if (this.display) {
        _.each(this.display, function(fn, rule) {
          html.find(rule).each(function() {
            $(this).html(fn.call(this, $(this)));
          });
        });
      }
      this.updateUI(function() {
        this.$board.html(html);
        this.releaseUI();
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

      this.updateUI(function() {
        var client = this
        , $from = this.atJsonpath(from)
        , $to = this.atJsonpath(to);
        if (!$from.length) {
          $from = $(dom).css({
            position: 'absolute',
            left: '50%',
            top: -$from.height()
          }).appendTo(this.$board);
        } else {
          $from.css({
            position: 'absolute',
            left: $from.position().left,
            top: $from.position().top
          });
        }
        $from
          .addClass('game-moving')
          .animate({
            left: $from.position().left + $to.offset().left - $from.offset().left,
            top: $from.position().top + $to.offset().top - $from.offset().top
          }, 200, function() {
            $from.remove();
            $to.append(dom);
            client.releaseUI();
          });
      });
    },

    updateUI: function(fn) {
      this.queued.push(fn);
    },

    releaseUI: function() {
      return this.queueRunning && this.runQueue();
    },

    runQueue: function() {
      if (this.queued.length) {
        this.queueRunning = true;
        this.queued.shift().call(this);
      } else {
        this.queueRunning = false;
        if (this.hilite && this.hilite[this.question.name]) {
          _.each(this.question.choices, function(choice) {
            this.atJsonpath(choice.jsonpath).addClass(this.hilite[this.question.name]);
          }, this);
        }
      }
    },

    toggleAnswer: function(e) {
      console.log($(e.currentTarget));
      var answer = _.find(this.question.choices, function(choice) {
        return choice.jsonpath==$(e.currentTarget).attr('jsonpath');
      });

      if (answer) {
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
      } else {
        console.log('continue');
      }
    },

    submit: function() {
      if (this.hilite && this.hilite[this.question.name]) {
        _.each(this.question.choices, function(choice) {
          this.atJsonpath(choice.jsonpath).removeClass(this.hilite[question.name]);
        }, this);
      }
      // errors in answer bubble up here? commented while building for bug-catching
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
      if (this.player!=player) {
        this.player = player;
        this.refresh();
      }
      this.runQueue();
    },

    clearAnswers: function() {
      this.answers = [];
      if (this.question.segment!='to') {
        this.$board.find('.selected').removeClass('selected');
      }
    },

    announce: function(msg) {
      this.$questions.html(msg);
    }
  });
}(window, jQuery));
