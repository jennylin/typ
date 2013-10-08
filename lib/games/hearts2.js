/*
simple arrays too cumbersome...
game.board.tokens; //array
_.intersection(game.players[1].armies, game.countries.russia.armies);
game.player[0].hand.filter(function(card) { return card.suit()=='H'; });

what if no child relationships
in, holder, owner


armies({ owner: 2, in: game.countries('russia') });
cards({ suit: 'H', holder: 1 })
cards({ type: 'wheat', holder: 1 })
armies({ holder: me }).except({ owner: me })


 game.board.tokens // collection

 game.countries('russia').armies({player:2}) // of a type and modified by a player (where an 'each' was supplied)
 game.player(2).armies({in: 'russia'}) // equivalent

 game.cards({ // query can have multiple clauses
   suit:'H',
   in: game.player(1).hand
 })
 game.player(1).hand.cards({suit:'H'}) // also equivalent

 game.player(me).hand.cards.except({suit:'H'})

 game.player(1).hand.cards('wheat')
 game.wheat({in: game.player(1).hand}) // equivalent

 game.countries({player:me}).armies.except({player:me}) // INVADERS!
 game.player(1).played.card().suit()
 game.player(1).hand.cards({suit:h}).quantity()

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

hearts = new Game('Hearts');

hearts
  .hasPlayers(4)
  .hasPieces(
    'cards',
    [
      '2h','3h','4h','5h','6h','7h','8h','9h','Th','Jh','Qh','Kh','Ah',
      '2s','3s','4s','5s','6s','7s','8s','9s','Ts','Js','Qs','Ks','As',
      '2d','3d','4d','5d','6d','7d','8d','9d','Td','Jd','Qd','Kd','Ad',
      '2c','3c','4c','5c','6c','7c','8c','9c','Tc','Jc','Qc','Kc','Ac',
    ],
    {
      suit: function() {
        return this.name[1];
      },
      value: function() {
        var value = this.name[0];
        if (value=='T') { return 10; }
        if (value=='J') { return 11; }
        if (value=='Q') { return 12; }
        if (value=='K') { return 13; }
        if (value=='A') { return 14; }
        return parseInt(value, 10);
      },
      points: function() {
        if (this.name=='Qs') { return 13; }
        if (this.suit()=='h') { return 1; }
        return 0;
      }
    }
  )
  .hasSpace('deck', 'cards');

hearts.players
  .haveSpace('hand', 'cards')
  .haveSpace('playingArea', 'card')
  .haveSpace('tricksArea', 'cards', {
    count: function() { return this.quantity()/4; }
  })
  .haveSpace('passingArea', 'cards')
  .cannotSee(function(me) {
    return [
      this.deck,
      this.players.except(me).hands.cards,
      this.players.except(me).passingAreas.cards,
      this.tricksAreas.cards,
    ];
  });

hearts.win = 100;

hearts.hasMoves({
  play: {
    description: 'Play a card from your hand onto the board',
    piece: function(move) { return move.player.hand.cards; },
    to: function(move) { return move.player.playingArea; },
    valid: function(move) {
      if (this.led===null) { // im leading
        return this.heartsBroken // hearts already broken
          || move.piece.points()==0 // this is not a point card
          || move.player.hand.cards({ points: 0 }).none();  // player only has point cards
      } 
      return move.piece.suit()==this.led.suit() // matches led
        || move.player.hand.cards({ suit: this.led.suit() }).none(); // or I have none
    }
  },

  passCards: {
    description: function() { return 'Pass 3 cards ' + ['to your left', 'across', 'to your right'][this.round % 4]; },
    pieces: function(move) { return move.player.hand.cards; },
    exactly: 3,
    to: function(move) { return move.player.passingArea; }
  }
});

hearts.round = 0;
hearts.players.each(function(player) { player.score = 0; });

hearts.when('start', function() {
  this.players.each(function(player) {
    player.score = 0;
  });
  this.become('deal');
});

hearts.when('deal', function() {
  this.cards.moveTo(this.deck);
  this.deck.cards.shuffle();
  this.players.each(function(player) {
    this.deck.cards({ first: 13 }).moveTo(player.hand);
  });
  this.players.each(function(player) {
    player.tricks = 0;
  });
  this.heartsBroken = false;
  if (this.round%4==3) {
    this.become('start play');
  } else {
    return this.players.must('passCards', function() {
      this.players.each(function(player) {
        player.passingArea.cards.moveTo(player.after(this.round % 4).hand);
      });
      this.become('start play');
    });
  }
});

hearts.when('start play', function() {
  this.led = this.card('2c');
  this.lead = this.player({ with: this.led });
  this.led.moveTo(this.lead.playingArea);
  this.currentPlayer = this.lead.after();
  this.become('play card');
});

hearts.when('play card', function() {
  this.currentPlayer.must('play', function(move) {
    if (!this.led) {
      this.led = move.piece;
    }
    if (move.piece.suit()=='h') { // in this version, only a true heart can break hearts
      this.heartsBroken = true;
    }
    if (this.playingAreas.cards.quantity()==4) {
      this.become('win trick');
    } else {
      this.currentPlayer = this.currentPlayer.after();
      this.become('play card');
    }
  });
});

hearts.when('win trick', function() {
  var winner = this.player({
    with: this.playingAreas.cards({ suit: this.led.suit() }).highest('value')
  });

  winner.tricks++;
  
  this.playingAreas.cards.moveTo(winner.tricksArea);
  if (winner.hand.cards.some()) {
    this.lead = this.currentPlayer = winner;
    this.led = null;
    this.become('play card');
  } else {
    this.become('end deal');
  }        
});

hearts.when('end deal', function() {
  this.players.each(function(player) {
    player.points = player.tricksArea.cards.sum('points');
  });

  // reverse the points if someone took all the points
  if (this.players.highest('points').points==this.cards.sum('points')) {
    this.players.each(function(player) {
      player.points = player.points==0 ? this.cards.sum('points') : 0;
    });
  }
  this.players.each(function(player) {
    player.score += player.points;
  });
  if (this.players.highest('score').score >= this.win) {
    this.players.highest('score').win();
  } else {
    this.become('deal');
  }
});
