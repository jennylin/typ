var typ = require('../typ');
module.exports = function() {
  var hearts = new typ.Game("hearts");
  hearts.setPlayerCount(4);

  hearts.state('init', function() {
    // decks you can pass in includes and excludes
    this.deck = new typ.Deck52(hearts);
    this.setPlayDirection('clockwise');
    this.transition('newDeal');
  })

  hearts.state('newDeal', function() {
    this.deck.shuffle();
    this.trick.reset();
    this.eachPlayer(function(player) {
      this.deck.deal(player, 13);
    });
    // some games might care about number of cards players can look at that were dealt to them vs hidden at the start
    this.direction = (this.transitionCount('newDeal') + 1) % 4;
    this.transition('passCards');
  });

  hearts.state('passCards', function() {
    if (game.count('passCards') % 4 == 3) {
      headers.transition('findLeader');
    } else {
      this.players.parallel(function(player, next) {
        game.ask(player).pick(3).from(player.hand).then(function(choices) {
          player.left(game.count(passCards)).hand.take(choices);
          next();
        });
      }).after(function() {
        headers.transition('findLeader');
      });
    }
  });

  headers.state('findLeader', function() {
    this.leader = this.findPlayer(function(player) {
      return player.hand.contains('2c');
    });
    this.transition('playTrick');
  });

  hearts.state('playTrick', function() {
    var game = this;
    var firstSuit = null;
    var cards = new Deck();
    game.players.sequentially(function(player, next) {
      var validCards = firstSuit && player.hand.where({suit: firstSuit})[0] ? player.hand.where({suit: firstSuit}) : player.hand;
      game.ask(player).pick().from(validCards).then(function(card) {
        if (!firstSuit) firstSuit == card;
        cards.push(card);
        next();
      });
    }).after(function() {
      var winner =
    })

    this.trick.play(this.players, function() {
      game.trick.setLead(this.taker);
      if (this.taker.hand.length == 0) {
        game.transition('score')
      } else {
        game.transition('playTrick');
      }
    })
  });

  hearts.state('score', function() {
    this.players.score(function() {
      return this.tricks.findBySuit("h").length + (this.tricks.card('QS') != null ? 13 : 0)
    })
    var controller = this.players.find(function() {
      return this.score == 26;
    })
    if (controller) {
      this.players.score(function() {
        if (this == controller) {
          this.score = 0;
        } else {
          this.score = 26;
        }
      })
    }
    hearts.score(this.players);
    if (this.players.find(function() { return this.totalScore > 100 })) {
      game.end()
    } else {
      game.transition('newDeal')
    }
  });

  return hearts;
};