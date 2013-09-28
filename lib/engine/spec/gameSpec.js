var Q = require('../game.js')
, _ = require('underscore');

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
    game.hasPieces('card', 'cards', ['2C', '3C', '4C'], {
      suit: function() { return this.name[1]; },
    });

    expect(game.cards).not.toBe(null);
    expect(game._pieces.length).toEqual(3);
    expect(game._pieces[0].suit()).toEqual('C');
  });

  it("finds pieces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasPieces('token', 'tokens', { fire: 10, water: 10 })
      .hasPiece('robber');

    expect(game.card('2C').name).toEqual('2C');
    expect(game.cards.except('2C').size()).toEqual(2);
    expect(game.cards({ suit: 'C' }).size()).toEqual(2);
    expect(game.cards.where({ suit: 'C' }).size()).toEqual(2);
    expect(game.cards.except({ suit: 'C' }).size()).toEqual(1);
    expect(game.cards.size({ suit: 'C' })).toEqual(2);
    expect(game.cards.size()).toEqual(3);
    expect(game.pieces.size()).toEqual(24);
    expect(game.tokens('fire').size()).toEqual(10);
    expect(game.tokens.size('fire')).toEqual(10);
    expect(game.robber.name).toEqual('robber');
  });

  it("performs aggregations on pieces", function() {
    game.hasPieces('card', 'cards', ['2C', '3C', '4S'], {
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
    game.hasPieces('card', 'cards', ['2C', '3C', '4S'], {
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
      .hasPieces('card', 'cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards');

    game.players
      .hasSpace('hand', 'cards')
      .hasPieces('army', 'armies', 10)
      .hasPiece('token');

    expect(game.pieces.size()).toBe(47);
    expect(game.player(1).hand).toBeDefined();
    expect(game.player(1).hand.cards.size()).toBe(0);
    expect(game.player(1).hand.size()).toBe(0);
    game.cards.move('2C').to(game.player(1).hand);
    expect(game.player(1).hand.cards.size()).toBe(1);
    expect(game.player(1).hand.size()).toBe(1);
    expect(game.player(1).hand.cards.some({ suit: 'C' })).toBeTruthy();
    expect(game.player(1).hand.some({ suit: 'C' })).toBeTruthy();

    expect(game.player(1).armies).toBeDefined();
    expect(game.player(1).token).toBeDefined();
    expect(game.player(1).armies.size()).toBe(10);
  });

  it("creates spaces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4C'], {
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
      .hasPieces('card', 'cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasPieces('token', 'tokens', 8)
      .hasSpaces('square', 'squares', 8, ['cards', 'tokens']);

    expect(game.squares).toBeDefined();
    expect(game.square(1)).toBeDefined();
    expect(game.squares.cards).toBeDefined();
    expect(game.squares.cards.size()).toBe(0);
    game.cards.move('2C').to(game.square(1));
    expect(game.squares.cards.size()).toBe(1);
    expect(game.square(1).cards.size()).toBe(1);
    expect(game.square(2).cards.size()).toBe(0);
    expect(game.squares(1).card().name).toBe('2C');
    expect(game.squares(1).cards.some({suit: 'C'})).toBeTruthy();
    expect(game.pieces({ in: game.square(1), suit: 'C' }).size()).toBe(1);
    expect(game.squares(1).size({suit: 'C'})).toBe(1);

    expect(game.squares.tokens).toBeDefined();
    expect(game.squares().tokens).toBeDefined();
    game.tokens.move({ first: 2 }).to(game.square(1));
    game.tokens.move(3).to(game.square(2));
    game.tokens.move(4).to(game.square(3));
    expect(game.squares(1).size()).toBe(3);
    expect(game.squares(1).tokens.size()).toBe(2);
    expect(game.squares.except(2).tokens.size()).toBe(3);
    
  });

  it("moves pieces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards')
      .hasSpace('turnUp', 'card');

    game.cards.move({ first: 2 }).to(game.deck);
    expect(game.cards({ in: game.deck }).size()).toBe(2);
    expect(game.deck.cards.size()).toBe(2);
    game.cards.move('2C').to(game.turnUp);
    expect(game.deck.cards.size()).toBe(1);
    expect(game.space({ with: game.card('2C') })).toBe(game.turnUp);
    expect(game.turnUp.card.singular).toBeTruthy();
    expect(game.turnUp.card()).toBe(game.card('2C'));
    expect(function() { game.cards.move({ first:1 }).to(game.turnUp); }).toThrow('turnUp can only hold one \'card\'');
  });

  it("binds where", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4S'])
      .hasSpaces('square', 'squares', 8, ['cards']);
    square = game.square(1);
    expect(game.cards.where()).toBe(game.cards());
    expect(game.card.where()).toBe(game.card());
    expect(square.card.where()).toBe(square.card());
    expect(square.cards.where()).toBe(square.cards());
    expect(square.pieces.where()).toBe(square.pieces());
  });
});
