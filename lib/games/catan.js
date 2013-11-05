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

catan.hasPlayers(2);

catan
  .hasPieces({
    type: 'resources',
    names: { wheat: 40, sheep: 40, brick: 40, stone: 40, lumber: 40 }
  })
  .hasPieces({
    type: 'developmentCards',
    names: { victory: 20, knight: 20 },
  })
  .hasPiece({
    name: 'robber'
  });

catan.players
  .havePieces({
    type: 'cities',
    number: 5
  })
  .havePieces({
    type: 'settlements',
    number: 5
  })
  .havePieces({
    type: 'roads',
    number: 15
  })
  .haveSpace({
    name: 'hand',
    holds: [ 'resources', 'developmentCards']
  });

catan.hasSpaces({
  name: 'spaces',
  number: 19,
  holds: 'robber',
  attributes: {
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
    resource: null,  
    roll: null
  },
  methods: {
    adjacentPoints: function() {
      var space = this;
      return this.game.points(function(point) {
        return this.adjacentSpaceAndPoint(space, point);
      });
    }
  }
});

catan.hasSpaces({
  name: 'edges',
  number: 72,
  holds: 'road',
  attributes: {
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
    }
  },
  methods: {
    adjacentPoints: function() {
      var edge = this;
      return this.game.points(function(point) {
        return this.adjacentPointAndEdge(point, edge);
      });
    }
  }
});

catan.hasSpaces({
  name: 'points',
  number: 54,
  holds: ['city', 'settlement'],
  attributes: {
    x: function() {
      return [
         -4,   0,   4,
       -6,  -2,   2,   6,
       -6,  -2,   2,   6,
     -8,  -4,   0,   4,   8,
     -8,  -4,   0,   4,   8,
  -10,  -6,  -2,   2,   6,   10,
  -10,  -6,  -2,   2,   6,   10,
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
    }
  },
  methods: {
    adjacent: function() {
      var point1 = this;
      return this.game.points(function(point2) {
        return this.adjacentPointAndPoint(point1, point2);
      });
    },
    adjacentSpaces: function() {
      var point = this;
      return this.game.spaces(function(space) {
        return this.adjacentSpaceAndPoint(space, point);
      });
    }
  }
});

catan.hasSpaces({
  name: 'harbors',
  number: 12,
  attributes: {
    x: function() {
      return [-6, 2, 7, -9, 11, -6, 2, 7, -9][this.position];
    },
    y: function() {
      return [11, 11, 8, 4, 0, -11, -11, -8, -4][this.position];
    },
    resource: null,  
    amount: 3
  }
});

catan.hasMoves({
  placeSettlement: {
    description: 'Place your settlement',
    piece: function(move) { return move.player.settlement.unplayed(); },
    to: function(move) {
      return this.points(function(point) {
        return point.adjacent().settlements().none() && point.adjacent().cities().none();
      });
    }
  },
  payForSettlement: {
    piece: function(move) {
      return [
        move.player.hand.resource('brick'),
        move.player.hand.resource('lumber'),
        move.player.hand.resource('sheep'),
        move.player.hand.resource('grain')
      ];
    },
    exactly: 4
  },
  buySettlement: {
    moves: ['placeSettlement', 'payForSettlement']
  },
  placeCity: {
    description: 'Place your city',
    piece: function(move) { return move.player.city.unplayed(); },
    to: function(move) {
      return this.points(function(point) {
        return point.adjacent().settlements().none() && point.adjacent().cities().none();
      });
    }
  },
  payForCity: {
    piece: function(move) {
      return [
        move.player.hand.resources('stone').first(3),
        move.player.hand.resources('sheep').first(2)
      ];
    },
    exactly: 5
  },
  buyCity: {
    moves: ['placeCity', 'payForCity']
  },
  placeRoad: {
    description: 'Place your road',
    piece: function(move) { return move.player.road.unplayed(); },
    to: function(move) {
      return this.edges(function(edge) {
        return edge.adjacentPoints().settlements({ player: move.player }).some() || edge.adjacentPoints().cities({ player: move.player }).some();
      });
    }
  },
  payForRoad: {
    piece: function(move) {
      return [
        move.player.hand.resource('brick'),
        move.player.hand.resource('lumber')
      ];
    },
    exactly: 2
  },
  buyRoad: {
    moves: ['placeRoad', 'payForRoad']
  },
  play: {
    description: 'Purchase, trade, play cards or end turn',
    piece: function(move) {
      var choices = ['road', 'settlement', 'city', 'developmentCard', 'wheat', 'sheep', 'brick', 'stone', 'lumber'];
    }
  }

});

catan.adjacentSpaceAndPoint = function(space, point) {
  return Math.abs(point.x() - space.x()) <= 2 && Math.abs(point.y() - space.y()) <= 3;
};
catan.adjacentEdgeAndEdge = function(edge1, edge2) {
  return Math.abs(edge1.x() - edge2.x()) <= 2 && Math.abs(edge1.y() - edge2.y()) <= 2;
};
catan.adjacentPointAndPoint = function(point1, point2) {
  return Math.abs(point1.x() - point2.x()) <= 2 && Math.abs(point1.y() - point2.y()) <= 2;
};
catan.adjacentPointAndEdge = function(point, edge) {
  return Math.abs(edge.x() - point.x()) <= 1 && Math.abs(edge.y() - point.y()) <= 1;
};

catan.when('start', function() {
  // randomly distribute resources and rolls
  _.each(_.shuffle(['desert', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'brick', 'stone', 'lumber', 'wheat', 'sheep', 'lumber']), function(resource, index) {
    this.space(index + 1).resource = resource;
  }, this);
  _.each(_.shuffle([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]), function(roll, index) {
    catan.spaces.except({resource: 'desert'}).nth(index + 1).roll = roll;
  });

  this.robber.moveTo(this.space({ resource: 'desert' }));

  this.become('place initial settlement');
});

catan.when('place initial settlement', function() {
  this.players.must(function(player, next) {
    player.must('placeSettlement', function(move) {
      move.to.adjacentSpaces().each(function(space) {
        if (space.resource != 'desert') {
          this.resources(space.resource).unplayed().first().moveTo(move.player.hand);
        }
      });
      player.must('placeRoad', function() {
        next();
      });
    });
  }, function() {
    this.players.backwards().from(catan.players.last()).must('placeSettlement', function() {
      this.currentPlayer = this.player(1);
      this.become('start turn');
    });
  });
});

catan.when('start turn', function() {
  this.roll = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
  this.spaces({ roll: this.roll }).each(function(space) {
    space.adjacentPoints().each(function(point) {
      if (point.settlement()) {
        this.resources(space.resource).unplayed().first().moveTo(point.settlement().player.hand);
      }
      if (point.city()) {
        this.resources(space.resource).unplayed().first(2).moveTo(point.city().player.hand);
      }
    });
  });
  this.players.announce('Rolled ' + this.roll);

  this.currentPlayer.must([ 'buyRoad', 'buySettlement', 'endTurn' ], function() {
    this.become('start turn');
  });
});
