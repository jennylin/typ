/*
    87654321012345678
      X       X
       / \ / \ / \ 
9     .   .   .   .       
8     | a | b | c |X
7     .   .   .   .      
6    / \ / \ / \ / \
5   .   .   .   .   .
4  X| d | e | f | g |
3   .   .   .   .   .
2  / \ / \ / \ / \ / \
1 .   .   .   .   .   .   
0 | h | i | j | k | l |X
*/

var catan = new Game('Catan');

catan
  .hasPlayers(4)
  .hasPieces('resources', { wheat: 40, sheep: 40, brick: 40, stone: 40, lumber: 40 })
  .hasPieces('developmentCards', 40)
  .players
    .havePieces('cities', 5)
    .havePieces('settlements', 5)
    .havePieces('roads', 20)
    .haveSpace('hand', [ 'resources', 'developmentCards']);

catan
  .hasPiece('robber')
  .hasSpace('pile', ['robber', 'cities', 'settlements', 'roads', 'resources', 'developmentCards'])
  .hasSpaces('spaces', 19, 'robber', {
    x: function() {
      return [
        -4,  0,  4,
      -6, -2,  2,  6,
    -8, -4,  0,  4,  8,
      -6, -2,  2,  6,
        -4,  0,  4
      ][this.position];
    },  
    y: function() {
      return [
        8,  8,  8,
      4,  4,  4,  4,
    0,  0,  0,  0,  0,
     -4, -4, -4, -4,
       -8, -8, -8
      ][this.position];
    },
    adjacentPoints: function() {
      var space = this;
      return this.game.points(function(point) {
        return Math.abs(point.x() - space.x()) <=2 && Math.abs(point.y() - space.y()) <= 3;
      });
    },
    resource: null,  
    roll: null
  })
  .hasSpaces('edges', 72, 'road', {
    x: function() {
      return [
        -5, -3, -1,  1,  3,  5,
      -6,     -2,      2,      6,
    -7, -5, -3, -1,  1,  3,  5,  7,
  -8,     -4,      0,      4,      8,
-9, -7, -5, -3, -1,  1,  3,  5,  7,  9,
-10,  -6,     -2,      2,      6,     10,
-9, -7, -5, -3, -1,  1,  3,  5,  7,  9,
  -8,     -4,      0,      4,      8,
    -7, -5, -3, -1,  1,  3,  5,  7,
      -6,     -2,      2,      6,
        -5, -3, -1,  1,  3,  5
      ][this.position];
    },
    y: function() {
      return [
        10, 10, 10, 10, 10, 10,
       8,      8,      8,      8,
     6,  6,  6,  6,  6,  6,  6,  6,
   4,      4,      4,      4,      4,
 2,  2,  2,  2,  2,  2,  2,  2,  2,  2,
0,     0,      0,      0,      0,      0,
-2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
  -4,     -4,     -4,     -4,     -4,
    -6, -6, -6, -6, -6, -6, -6, -6,
      -8,     -8,     -8,     -8,
       -10,-10,-10,-10,-10,-10
      ][this.position];
    },
    adjacent: function() {
      return this.others(function(other) {
        return Math.abs(other.x() - this.x()) <=2 && Math.abs(other.y() - this.y()) <= 2;
      });
    }
  })
  .hasSpaces('points', 54, ['city', 'settlement'], {
    x: function() {
      return [
         -4,   0,   4,
       -6,  -2,   2,   6,
       -6,  -2,   2,   6,
     -8,  -4,   0,   4,   8,
     -8,  -4,   0,   4,   8,
  -10,  -6,  -2,   2,   6,   10
  -10,  -6,  -2,   2,   6,   10
     -8,  -4,   0,   4,   8,
     -8,  -4,   0,   4,   8,
       -6,  -2,   2,   6,
       -6,  -2,   2,   6,
         -4,   0,   4
      ][this.position];
    },  
    y: function() {
      return [
         11,  11,  11,
       9,   9,   9,   9,
       7,   7,   7,   7,
     5,   5,   5,   5,   5,
     3,   3,   3,   3,   3,
  1,   1,   1,   1,   1,   1,
 -1,  -1,  -1,  -1,  -1,  -1,
    -3,  -3,  -3,  -3,  -3,
    -5,  -5,  -5,  -5,  -5,
      -7,  -7,  -7,  -7,
      -9,  -9,  -9,  -9,
        -11, -11, -11,
      ][this.position];
    },  
    adjacent: function() {
      return this.others(function(other) {
        return Math.abs(other.x() - this.x()) <=2 && Math.abs(other.y() - this.y()) <= 2;
      });
    },
    adjacentEdges: function() {
      var point = this;
      return this.game.edges(function(edge) {
        return Math.abs(edge.x() - point.x()) <=1 && Math.abs(edge.y() - point.y()) <= 1;
      });
    }
  })
  .hasSpaces('harbors', 12, {
    x: function() {
      return [-6, 2, 7, -9, 11, -6, 2, 7, -9][this.position];
    },
    y: function() {
      return [11, 11, 8, 4, 0, -11, -11, -8, -4][this.position];
    },
    resource: null,  
    amount: 3
  })
  .hasMoves({
    placeSettlement: {
      description: 'Place your settlement',
      piece: function(move) { return move.player.settlement.except({ in: this.points }); },
      to: function(move) { return this.points; }
    }
  });

catan.when('start', function() {
  // randomly distribute resources and rolls
  _.each(_.shuffle(['desert', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'lumber']), function(resource, index) {
    catan.space(index + 1).resource = resource;
  });
  _.each(_.shuffle([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]), function(roll, index) {
    catan.spaces.except({resource: 'desert'}).nth(index + 1).roll = roll;
  });

  catan.allPieces.moveTo(catan.pile);

  catan.robber.moveTo(catan.space({ resource: 'desert' }));

  catan.players.must('placeSettlement', function() {
  });
});
