
var arimaa = new Game('Arimaa');

arimaa
  .hasPlayers(2)
  .players
    .havePieces('pieces', {
      elephant: 1,
      camel: 1,
      horse: 2,
      dog: 2,
      cat: 2,
      rabbit: 8
    }, {
      strength: function() {
        if (this.name=='elephant') { return 6; }
        if (this.name=='camel') { return 5; }
        if (this.name=='horse') { return 4; }
        if (this.name=='dog') { return 3; }
        if (this.name=='cat') { return 2; }
        if (this.name=='rabbit') { return 1; }
      },
      friendlyAdjacent: function() {
        return this.owner.pieces({
          in: this.square.adjacent()
        });
      },
      weakerAdjacent: function() {
        return this.owner.opponent().pieces({
          in: this.square.adjacent(),
          strength: _.range(1, this.strength())
        });
      },
      strongerAdjacent: function() {
        return this.owner.opponent().pieces({
          in: this.square.adjacent(),
          strength: _.range(this.strength() + 1, 7)
        });
      },
      frozen: function() {
        return this.strongerAdjacent().some() && this.friendlyAdjacent().none();
      },
      trapped: function() {
        return this.square && this.square.trap() && this.friendlyAdjacent().none();
      },
      backwards: function() {
        return this.game.square({
          row: this.square.row() + (this.player==1 ? 1 : -1),
          column: this.square.column()
        });
      },
      availableSquares: function() {
        return _.filter(this.square.adjacent(), function(square) {
          return square && square.none() && (this.name!='rabbit' || square!=this.backwards());
        });
      }
    })
    .haveSpace('hand', 'pieces');

arimaa
  .hasSpaces('squares', 64, 'piece', {
    column: function() { return this.position%8 + 1 ; },
    row: function() { return (this.position>>3) + 1; },
    trap: function() { return this.row()%3==0 && this.column()%3==0; },
    adjacent: function() {
      return [
        this.game.square({ row: this.row(), column: this.column()+1 }),
        this.game.square({ row: this.row(), column: this.column()-1 }),
        this.game.square({ row: this.row()+1, column: this.column() }),
        this.game.square({ row: this.row()-1, column: this.column() })
      ];
    }
  })
  .hasMoves({
    place: {
      description: 'Place your pieces',
      piece: function(move) { return move.player.pieces; },
      to: function(move) { return this.squares({ row: move.player.position ? [7,8] : [1,2] }); }
    },
    move: {
      description: function() { return 'Step ' + this.step; },
      piece: function(move) {
        if (this.lastMove && this.lastMove.isPush) { // pushed last move and now must move pushing piece
          return this.lastMove.pushing;
        }

        var pieces = this.allPieces.filter(function(piece) { // any piece with available moves
          if (piece.player==move.player) {
            return piece.availableSquares().length && !piece.frozen();
          }
          return piece.availableSquares().length && this.step < 4 && piece.strongerAdjacent({ frozen: false }).some(); // can push opponents
        });

        if (this.lastMove && this.lastMove.isPull) { // may have pulled last move and may also pull now
          pieces = pieces.concat(this.lastMove.pulling);
        }
        return pieces;
      },
      to: function(move) {
        if (this.lastMove && this.lastMove.isPush) { // must complete push
          return this.lastMove.from;
        }
        if (this.lastMove && this.lastMove.isPull && move.piece.player!=move.player) { // must complete pull
          return [this.lastMove.from, move.piece.square]; // but can cancel
        }          
        return move.piece.availableSquares().concat(move.piece.square); // can always cancel
      },
      valid: function(move) {
        if (move.piece.player!=move.player && (!this.lastMove || !this.lastMove.isPull)) {
          move.isPush = true;
          move.pushing = move.piece.strongerAdjacent().all();
        }
        if (move.piece.weakerAdjacent().some()) {
          move.isPull = true;
          move.pulling = move.piece.weakerAdjacent().all();
        }
        return true;
      }
    }
  });

arimaa.when('start', function() {
  this.players.pieces.each(function(piece) { piece.moveTo(piece.owner.hand); });
  //this.become('setup');
  this.become('fakesetup');
});

arimaa.when('setup', function() {
  if (this.player(1).hand.some()) {
    this.player(1).must('place', function() { this.become('setup'); });
  } else if (this.player(2).hand.some()) {
    this.player(2).must('place', function() { this.become('setup'); });
  } else {
    this.become('play');
  }
});

arimaa.when('fakesetup', function() {
  this.player(1).hand.shuffle();
  this.player(2).hand.shuffle();
  this.squares.first(16).each(function(square) { this.player(1).hand.first().moveTo(square); });
  this.squares.last(16).each(function(square) { this.player(2).hand.first().moveTo(square); });
  this.currentPlayer = arimaa.player(1);
  this.step = 1;
  this.become('play');
});

arimaa.when('play', function() {
  this.player(1).pieces({ trapped: true }).moveTo(this.player(1).hand);
  this.player(2).pieces({ trapped: true }).moveTo(this.player(2).hand);

  this.currentPlayer.must('move', function(move) {
    if (move.from!=move.to) {
      if (this.step==4) {
        this.currentPlayer = this.currentPlayer.after();
        this.step = 1;
        this.lastMove = null;
      } else {
        this.step++;
        this.lastMove = move;
      }
    }
    this.become('play');
  });
});