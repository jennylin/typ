var Q = require('../game.js');

describe("Q", function() {

  var game;

  beforeEach(function() {
    game = new Q.Game('Test');
  });

  it("creates games", function() {
    expect(game).not.toBe(null);
  });

  it("has players", function() {
    game.hasPlayers(4);
    expect(game.players).toBeDefined();
    expect(game._players.length).toBe(4);
  });

  it("creates pieces", function() {
    game.hasPieces('cards', ['2C', '3C', '4C'], {
      suit: function() { return this.name[1]; },
    });

    expect(game.cards).not.toBe(null);
    expect(game._pieces.length).toEqual(3);
    expect(game._pieces[0].suit()).toEqual('C');
  });

  it("finds pieces", function() {
    game
      .hasPieces('cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasPieces('tokens', { fire: 10, water: 10 })
      .hasPiece('robber');

    expect(game.card('2C').name).toEqual('2C');
    expect(game.cards.except('2C').quantity()).toEqual(2);
    expect(game.cards({ suit: 'C' }).quantity()).toEqual(2);
    expect(game.cards.where({ suit: 'C' }).quantity()).toEqual(2);
    expect(game.cards.except({ suit: 'C' }).quantity()).toEqual(1);
    expect(game.cards.quantity({ suit: 'C' })).toEqual(2);
    expect(game.cards.quantity()).toEqual(3);
    expect(game.allPieces.quantity()).toEqual(24);
    expect(game.tokens('fire').quantity()).toEqual(10);
    expect(game.tokens.quantity('fire')).toEqual(10);
    expect(game.robber.name).toEqual('robber');
  });

  it("performs aggregations on pieces", function() {
    game.hasPieces('cards', ['2C', '3C', '4S'], {
      suit: function() { return this.name[1]; },
      value: function() { return parseInt(this.name[0], 10); },
    });

    expect(game.cards('2C').list('suit')).toEqual(['C']);
    expect(game.cards({first: 2}).list('suit')).toEqual(['C', 'C']);
    expect(game.cards({last: 2}).list('suit')).toEqual(['C', 'S']);
    expect(game.cards({ suit: 'C' }).list()).toEqual(['2C', '3C']);
    expect(game.cards.some({value: 4})).toBe(true);
    expect(game.cards.none({suit: 'H'})).toBe(true);
  });

  it("performs underscore methods on pieces", function() {
    game.hasPieces('cards', ['2C', '3C', '4S'], {
      suit: function() { return this.name[1]; },
      value: function() { return parseInt(this.name[0], 10); },
    });

    expect(game.cards.highest('value')).toBe(game.card('4S'));
    expect(game.cards({ suit: 'C' }).highest('value')).toBe(game.card('3C'));
    expect(game.cards({ suit: 'C' }).sum('value')).toEqual(5);
    expect(game.cards.lowest('value')).toBe(game.card('2C'));
    expect(game.cards.map(function(card) { return card.value(); })).toEqual([2,3,4]);
    var tmp = [];
    game.cards.each(function(card) { tmp.push(card.suit()); });
    expect(tmp).toEqual(['C','C','S']);
  });

  it("players have pieces and spaces too", function() {
    game.hasPlayers(4);
    game
      .hasPieces('cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards');

    game.players
      .haveSpace('hand', 'cards')
      .havePieces('armies', 10)
      .havePiece('token');

    game.hasSpace('field', 'armies');


    expect(game.allPieces.quantity()).toBe(47);
    expect(game.player(1).hand).toBeDefined();
    expect(game.player(1).hand.cards.quantity()).toBe(0);
    expect(game.player(1).hand.quantity()).toBe(0);
    game.cards('2C').moveTo(game.player(1).hand);
    expect(game.player(1).hand.cards.quantity()).toBe(1);
    expect(game.player(1).hand.quantity()).toBe(1);
    expect(game.player(1).hand.cards.some({ suit: 'C' })).toBeTruthy();
    expect(game.player(1).hand.some({ suit: 'C' })).toBeTruthy();
    expect(game.player({ with: '2C' })).toBe(game.player(1));
    expect(game.hand({ with: '2C' }).owner).toBe(game.player(1));

    expect(game.player(1).armies).toBeDefined();
    expect(game.player(1).token).toBeDefined();
    expect(game.player(1).armies.quantity()).toBe(10);
    expect(game.players.armies.quantity()).toBe(40);
    expect(game.players.except(1).armies.quantity()).toBe(30);
    expect(game.player(1).armies({ first: 3 }).quantity()).toBe(3);
  });

  it("creates spaces", function() {
    game
      .hasPieces('cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards')
      .hasSpace('turnUp', 'card');

    expect(game.deck).toBeDefined();
    expect(game.deck.cards).toBeDefined();
    expect(game.deck.card).toBeDefined();
    expect(game.turnUp).toBeDefined();
    expect(game.turnUp.card).toBeDefined();
  });

  it("creates plural spaces", function() {
    game
      .hasPieces('cards', ['2C', '3C', '4H'], {
        suit: function() { return this.name[1]; },
      })
      .hasPieces('tokens', 8)
      .hasSpaces('squares', 8, ['cards', 'tokens']);

    expect(game.squares).toBeDefined();
    expect(game.square(1)).toBeDefined();
    expect(game.squares.cards).toBeDefined();
    expect(game.squares.cards.quantity()).toBe(0);
    expect(game.cards({ suit: 'H', first: 1 }).name).toBe('4H');
    game.cards('2C').moveTo(game.square(1));
    expect(game.squares.cards.quantity()).toBe(1);
    expect(game.square(1).cards.quantity()).toBe(1);
    expect(game.square(2).cards.quantity()).toBe(0);
    expect(game.squares(1).card().name).toBe('2C');
    expect(game.squares(1).cards.some({suit: 'C'})).toBeTruthy();
    expect(game.allPieces({ in: game.square(1), suit: 'C' }).quantity()).toBe(1);
    expect(game.squares(1).quantity({suit: 'C'})).toBe(1);

    expect(game.squares.tokens).toBeDefined();
    expect(game.squares().tokens).toBeDefined();
    game.tokens({ first: 2 }).moveTo(game.square(1));
    game.tokens(3).moveTo(game.square(2));
    game.tokens(4).moveTo(game.square(3));
    expect(game.squares(1).quantity()).toBe(3);
    expect(game.squares(1).tokens.quantity()).toBe(2);
    expect(game.squares.except(2).tokens.quantity()).toBe(3);
    game.square(1).tokens(1).moveTo(game.square.last());
    expect(game.squares(1).tokens.quantity()).toBe(1);
    expect(game.squares(8).tokens.quantity()).toBe(1);
  });

  it("moves pieces", function() {
    game
      .hasPieces('cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards')
      .hasSpace('turnUp', 'card');

    game.cards({ first: 2 }).moveTo(game.deck);
    expect(game.cards({ in: game.deck }).quantity()).toBe(2);
    expect(game.deck.cards.quantity()).toBe(2);
    game.card('2C').moveTo(game.turnUp);
    expect(game.deck.cards.quantity()).toBe(1);
    expect(game.allSpaces({ with: '2C' }).first()).toBe(game.turnUp);
    expect(game.allSpaces({ with: game.card('2C') }).first()).toBe(game.turnUp);
    expect(game.turnUp.card.singular).toBeTruthy();
    expect(game.turnUp.card()).toBe(game.card('2C'));
    game.cards({ first:1 }).moveTo(game.turnUp);
    expect(function() { game.cards({ last:1 }).moveTo(game.turnUp); }).toThrow('turnUp can only hold one \'card\'');
  });

  it("binds where", function() {
    game
      .hasPieces('cards', ['2C', '3C', '4S'])
      .hasSpaces('squares', 8, ['cards']);
    square = game.square(1);
    expect(game.cards.where()).toBe(game.cards());
    expect(game.card.where()).toBe(game.card());
    expect(square.card.where()).toBe(square.card());
    expect(square.cards.where()).toBe(square.cards());
    expect(square.allPieces.where()).toBe(square.allPieces());
  });

  it("tries to catch errors", function() {
    game.hasPlayers(4);
    game
      .hasPieces('cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards');

    game.players
      .haveSpace('hand', 'cards')
      .havePieces('armies', 10)
      .havePiece('token');

    expect(function() { game.player(1).armies().moveTo(game.deck); }).toThrow('\'deck\' does not hold \'army\'');
    expect(function() { game.cards().moveTo(game.noSuchSpace); }).toThrow('no such space');
  });
});
