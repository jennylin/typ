game.board.tokens; //array
_.intersection(game.players[1].armies, game.countries.russia.armies);
game.player[0].hand.filter(function(card) { return card.suit()=='H'; });

/**
 game.board.tokens // collection

 game.countries('russia').armies({player:2}) // of a type and modified by a player (where an 'each' was supplied)
 game.player(2).armies({in: 'russia'}) // equivalent

 game.cards({ // query can have multiple clauses
   suit:'H',
   in: game.player(1).hand
 })
 game.player(1).hand.cards({suit:'H'}) // also equivalent

 game.player(me).hand.cards.except({suit:'H'})
 game.player(me).hand.cards(not: {suit:'H'}) // equivalent

 game.player(1).hand.cards('wheat')
 game.wheat({in: game.player(1).hand}) // equivalent

 game.countries({player:me}).armies.except({player:me}) // INVADERS!
 game.player(1).played.card().suit()
 game.player(1).hand.cards({suit:h}).size()

 // first/last/the are short-cuts to get one element out of an array
 game.player(1).hand.cards.one({suit:h})
 game.player(1).hand.cards.first({suit:h})
 game.player(1).hand.cards.last({suit:h})

 game.player(1).hand.cards({suit:h}).highest('value')
 game.player(1).hand.cards({suit:h}).some()
 game.player(1).hand.cards({suit:h}).none()

 game.players.one({with: '2c'})
 game.hands.one({with: '2c'}).player // equivalent
 */


hearts = new Game();

hearts.hasPlayers(4);

hearts.hasPieces(
  'card',
  'cards',
  ['2C',],
  {
    suit: function() {
      return this.name[1];
    },
    value: function() {
      var value = this.name[0];
      if (value=='J') { return 11; }
      if (value=='Q') { return 12; }
      if (value=='K') { return 13; }
      if (value=='A') { return 14; }
      return parseInt(value, 10);
    },
    points: function() {
      if (this.name=='QS') { return 13; }
      if (this.suit()=='H') { return 1; }
      return 0;
    }
  }
);

hearts
  .hasSpace('deck', 'cards');

hearts.players
  .hasSpace('hand', 'cards')
  .hasSpace('played', 'card')
  .hasSpace('tricks', 'cards')
  .cannotSee(function(me) {
    return [
      this.deck,
      this.players.except(me).hands.cards,
      this.tricks.cards
    ];
  });

hearts.win = 100;

hearts.moves = {
  play: new Move({
    description: 'Play a card from your hand onto the board',
    piece: function(move) { return move.player.hand.cards; },
    to: function(move) { return move.player.played; },
    valid: function(move) {
      return (this.led===null // im leading
              || move.card.suit()==this.led.suit() // matches led
              || move.player.hand.cards({ suit: this.led.suit() }).none()) // or I have none
        && (this.heartsBroken // hearts already broken
            || move.card.points()==0 // this is not a point card
            || move.player.hand.cards({ points: 0 }).none());  // player only has point cards
    },
    after: function(move) {
      if (move.card.suit()=='H') { // in this version, only a true heart can break hearts
        this.heartsBroken = true;
      }
    }
  }),

  passCards: new Move({
    description: function() { return 'Pass 3 cards ' + ['to your left', 'across', 'to your right'](this.round % 4); },
    pieces: function(move) { return move.player.hand.cards; },
    exactly: 3,
    to: function(move) { return move.player.after(this.round % 4).hand; }
  })
};

hearts.round = 0;
hearts.players.each(function(player) { player.score = 0; });

hearts.when('start', function() {
  become('deal');
});

hearts.when('deal', function() {
  this.cards.move().to(this.deck);
  this.deck.shuffle();
  this.players.each(function(player) {
    this.deck.cards.move({ first: 13 }).to(player.hand);
  });
  this.heartsBroken = false;
  if (this.become(state.round%4==0)) {
    this.become('start play');
  } else {
    return this.players.must('passCards').then(function() {
      this.become('start play');
    });
  }
});

hearts.when('start play', function() {
  this.lead = this.player({ with: '2c' });
  this.become('lead');
});

hearts.when('lead', function() {
  this.currentPlayer = this.lead;
  this.become('play card');
});

hearts.when('play card', function() {
  this.currentPlayer.must('play').then(function() {
    if (this.played.cards.size()==4) {
      this.become('win trick');
    }
    this.currentPlayer = this.currentPlayer.after();
    this.become('play card');
  });
});

hearts.when('win trick', function() {
  var winner = this.player({
    with: this.played.cards({ highest: 'value', suit: 'H' })
  }) || this.player({
    with: this.played.cards({ highest: 'value' })
  });

  winner.tricks++;
  
  hearts.played.cards.move().to(winner.tricks);
  if (winner.hand.cards.some()) {
    this.lead = winner;
    this.become('play trick');
  } else {
    this.become('end deal');
  }        
});

hearts.when('end deal', function() {
  this.players.each(function(player) {
    player.points = player.tricks.cards.sum('points');
  });

  // reverse the points if someone took all the points
  if (this.players.highest('points')==this.cards.sum('points')) {
    this.players.each(function(player) {
      player.points = player.points==0 ? this.cards.sum('points') : 0;
    });
  }
  this.players.each(function(player) {
    player.score += player.points;
  });
  if (this.players.highest(score) >= this.win) {
    this.players({ highest: 'score' }).win();
  } else {
    this.become('deal');
  }
});
