var hearts = new Game();

hearts.on('init', function() {
  // decks you can pass in includes and excludes
  this.deck = new Deck();
  this.players = Player.create(4);
  this.setPlayDirection('clockwise');
  this.transition('newDeal');
});

hearts.on('newDeal', function() {
  this.deck.shuffle();
  this.deck.deal(this.players, 13);
  // some games might care about number of cards players can look at that were dealt to them vs hidden at the start
  this.direction = (this.transitionCount('newDeal') + 1) % 4;
  this.transition('passCards');
});

hearts.on('passCards', function() {
  this.passCards({count: 3, offset: this.direction, function() {
    this.setLead('2C');
    this.transition('playTrick');
  });
});

hearts.on('playTrick', function() {
  this.loopPlayers().endsOn(function(loop) {
    return loop.count == 4;
  });
});
