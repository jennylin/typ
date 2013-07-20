var typ = require('./index')

var hearts = new typ.Game();

hearts.on('init', function() {
  // decks you can pass in includes and excludes
  this.deck = new typ.Deck(hearts);
  this.players = typ.Players.create(hearts, 4);
  this.setPlayDirection('clockwise');
  this.trick = new typ.Trick({trump:false});
  this.trick.on('card', function(card) {
    if (card.heart) {
      hearts.heartsBroken = true;
    }
  })
  this.trick.validLead(function(card) {
    return hearts.heartsBroken ? true : !card.heart;
  })
  this.transition('newDeal');
})

hearts.on('newDeal', function() {
  this.deck.shuffle();
  this.deck.deal(this.players, 13);
  // some games might care about number of cards players can look at that were dealt to them vs hidden at the start
  this.direction = (this.transitionCount('newDeal') + 1) % 4;
  this.transition('passCards');
});

hearts.on('passCards', function() {
  this.players.passCards({count: 3, offset: this.direction}, function() {
    this.setLead(this.players.findWithCard('2C'));
    this.transition('playTrick');
  });
});

hearts.on('playTrick', function() {
  var game = this;
  this.trick.play(this.players, function() {
    game.setLead(this.taker);
    if (this.taker.hand.length == 0) {
      game.transition('score')
    } else {
      game.transition('playTrick');
    }
  })
});

hearts.on('score', function() {
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

hearts.makeMoves([
], function(game) {
  console.dir(game);
});
