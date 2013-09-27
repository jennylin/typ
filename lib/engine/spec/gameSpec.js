var Q = require('../game.js');

describe("Q", function() {

  var game;

  beforeEach(function() {
    game = new Q.Game();
  });

  it ("creates games", function() {
    expect(game).not.toBe(null);
  });

  it ("creates pieces", function() {
    game.hasPieces('card', 'cards', ['2C', '3C', '4C'], {
      suit: function() { return this.name[1]; },
    });

    expect(game.cards).not.toBe(null);
    expect(game._pieces.length).toEqual(3);
    expect(game._pieces[0].suit()).toEqual('C');
  });

  it ("finds pieces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4S'], {
        suit: function() { return this.name[1]; },
      })
      .hasPieces('token', 'tokens', { fire: 10, water: 10 })
      .hasPiece('robber');

    expect(game.cards.one('2C').name).toEqual('2C');
    expect(game.cards.except('2C').size()).toEqual(2);
    expect(game.cards({ suit: 'C' }).size()).toEqual(2);
    expect(game.cards.where({ suit: 'C' }).size()).toEqual(2);
    expect(game.cards.except({ suit: 'C' }).size()).toEqual(1);
    expect(game.cards.size({ suit: 'C' })).toEqual(2);
    expect(game.cards.size()).toEqual(3);
    expect(game.pieces.size()).toEqual(24);
    expect(game.tokens('fire').size()).toEqual(10);
    expect(game.robber.name).toEqual('robber');
  });

  it ("performs aggregations on pieces", function() {
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


  it ("performs underscore methods on pieces", function() {
    game.hasPieces('card', 'cards', ['2C', '3C', '4S'], {
      suit: function() { return this.name[1]; },
      value: function() { return parseInt(this.name[0], 10); },
    });

    expect(game.cards.highest('value')).toBe(game.cards.the('4S'));
    expect(game.cards({ suit: 'C' }).highest('value')).toBe(game.cards.the('3C'));
    expect(game.cards({ suit: 'C' }).sum('value')).toEqual(5);
    expect(game.cards.lowest('value')).toBe(game.cards.the('2C'));
    expect(game.cards.map(function(card) { return card.value(); })).toEqual([2,3,4]);
    var tmp = [];
    game.cards.each(function(card) { tmp.push(card.suit()); });
    expect(tmp).toEqual(['C','C','S']);
  });

  it ("creates spaces", function() {
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

  it ("creates plural spaces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpaces('square', 'squares', 8, 'cards');

    expect(game.squares).toBeDefined();
    expect(game.square(1)).toBeDefined();
    expect(game.squares.cards).toBeDefined();
    expect(game.squares.cards.size()).toBe(0);
    game.cards.move('2C').to(game.square(1));
    expect(game.squares.cards.size()).toBe(1);
    expect(game.square(1).cards.size()).toBe(1);
    expect(game.square(2).cards.size()).toBe(0);
  });

  it ("moves pieces", function() {
    game
      .hasPieces('card', 'cards', ['2C', '3C', '4C'], {
        suit: function() { return this.name[1]; },
      })
      .hasSpace('deck', 'cards')
      .hasSpace('turnUp', 'card');

    game.cards.move().to(game.deck);
    expect(game.cards({ in: game.deck }).size()).toBe(3);
    expect(game.deck.cards.size()).toBe(3);
    game.cards.move({ nth:1 }).to(game.turnUp);
    expect(game.deck.cards.size()).toBe(2);
    expect(game.turnUp.card.singular).toBeTruthy();
    expect(game.turnUp.card()).toBe(game.cards.the('2C'));
    expect(function() { game.cards.move({ first:1 }).to(game.turnUp); }).toThrow('turnUp can only hold one \'card\'');
  });
});
