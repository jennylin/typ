/**
TODO:
 more error checking
 any cleanup
 dupe holds ?


game:
  owns players, spaces, pieces

players:
  owns spaces, pieces

spaces:
  owns spaces
  holds pieces
  do not move
  can be completely hidden

pieces:
  holds pieces
  can move
  identity can be hidden


Collection methods (Players, Spaces, Pieces)
  new([number / array], [hash of instance methods])
  ([name], [hash attributes]) // _.where() return collection with add'l filters. first arg just shorthand for id or name.
  except([string name], [hash attributes]) // _.reject
  both take add'l arg:
    in: space
    with: piece/space
    first/last: n

  items() // returns array of matching items
  each(fn)
  map(fn)
  list(attr) // _.pluck
  sum(attr)
  one([name], [hash])
  highest(attr), lowest(attr)
  shuffle
  sort(attr)
  size
  some/none([name], [hash])

Game
  hasSpaces(type, names, holds...) // create spaces root node and collection reference as name. Optional holds sets restriction and singular/plural on the piece collection or value and creates reference to piece collection on this space
  hasSpace(name, holds...) // create space root node and instance reference as name
  hasPieces(singular, plural, names..., methods) // create pieces instances and create reference to collection with plural name
  hasPiece(name, methods) // create piece instance and create reference to instance with name
  hasPlayers(n)
  announce
  when(phase, fn)
  become(phase, fn)
  spaces // collection
  pieces // collection
  <name of space> // owned spaces collection
  <name of piece> // owned pieces collection
    
Players // players coll/single
  hasSpace/s // convenience for each hasSpace/s
  hasPiece/s // convenience for each hasPiece/s
  <name of space> // owned spaces collection
  <name of piece> // owned pieces collection

Player // player instance, has spaces, pieces, holds pieces through spaces
  hasSpace/s([number,] name, holds...) // create space(s) node as child on this player, and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece collection or value and creates reference to piece collection on this space
  hasPieces(singular, plural, names..., methods) // create pieces instances and create reference to collection with plural name
  hasPiece(name, methods) // create piece instance and create reference to instance with name
  spaces // collection
  pieces // collection
  <name of space> // owned spaces collection
  <name of piece> // owned pieces collection
  <name of attr> // value
  must/can/cannot(move)
  after // player after this one
  win
  
Spaces // spaces coll/single
  hasSpace/s // convenience for each hasSpace/s
  <name of space> // nested spaces coll
  <name of piece> // pieces coll
  having([string name], [hash attributes]) // return space that has pieces matches by name and/or attributes

Space // space instance - not directly instantiated, must use hasSpace/s. spaces do not move, permanent tree structure
  hasSpace/s(name, Space) // create space(s) node as child on this space, and instance/collection reference as name
  spaces // collection
  pieces // collection
  <name of space> // nested spaces coll
  <name of piece> // pieces coll
  has([string name], [hash attributes]) // return whether space has pieces matches by name and/or attributes
  delegate all collection methods to pieces

Pieces // pieces coll
  have attributes
  move([filter]).to(space)

Piece // piece instance
  moveTo(space)

*/

var _ = require('underscore');

CanHaveSpaces = {
  /**
   * create space root node and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece
   * collection and creates reference to piece collection on this space
   */
  hasSpace: function(name, holds) {
    this[name] = this.createSpace(name).holds(holds);
    return this;
  },

  hasSpaces: function(singular, plural, number, holds) {
    _(number).times(function() {
      this.createSpace(singular).holds(holds);
    }, this);

    this[plural] = new Spaces({
      game: this.game,
      owner: this
    }).holds(holds);
    this[singular] = new Spaces({
      game: this.game,
      singular: true,
      owner: this
    }).holds(holds);
    return this;
  },

  createSpace: function(name) {
    var space = new Space({ game: this.game, name: name, owner: this });
    this.game._spaces.push(space);
    return space;
  },
};

CanHavePieces = {
  /**
   * Create pieces instances and create reference to collection with plural name
   */
  hasPieces: function(singular, plural, names, methods) { // names e.g.: ['2C',...], { wheat: 3,... }
    this.game._pieceNames.push([singular, plural]);

    if (_.isNumber(names)) {
      var tmp = {};
      tmp[singular] = names;
      names = tmp;
    }

    _.each(names, function(value, key) {
      if (_.isNumber(value)) {
        _(value).times(function() {
          this.createPiece(singular, key, methods);
        }, this);
      } else {
        this.createPiece(singular, value, methods);
      }
    }, this);

    this[plural] = new Pieces({
      game: this.game,
      type: singular,
      owner: this
    });
    this[singular] = new Pieces({
      game: this.game,
      type: singular,
      singular: true,
      owner: this
    });
    return this;
  },

  /**
   * Create piece instance and create reference to instance with name
   */
  hasPiece: function(name, methods) {
    this[name] = this.createPiece(name, name, methods);
    return this;
  },

  createPiece: function(type, name, methods) {
    var piece = _.extend(new Piece({game: this.game, type: type, name: name, owner: this }), methods);
    this.game._pieces.push(piece);
    return piece;
  }
};

var Collection = {
  where: function(name, query, reject) {
    if (_.isNumber(name)) {
      query = _.extend(query || {}, { nth: name });
    } else if (_.isString(name)) {
      query = _.extend(query || {}, { name: name });
    } else {
      query = name;
    }
    if (query===undefined) {
      filtered = this;
    } else {
      var previous = {};
      previous[reject ? 'rejects' : 'filters'] = _.extend(_.clone(this[reject ? 'rejects' : 'filters']) || {}, query);
      filtered = this.clone(previous);
    }
    if (filtered.singular || filtered.filters.first==1 || filtered.filters.last==1 || filtered.filters.nth!==undefined) {
      return filtered.items()[0];
    }
    return filtered;
  },

  except: function(name, query) {
    return this.where(name, query, true);
  },

  items: function() {
    var collection = this;

    var indexTests = ['first', 'last', 'nth'];

    var firstPass = _.filter(this._unscoped, function(item) {
      return _.every(_.omit(collection.filters || {}, indexTests), function(value, key) {
        return collection._test(item, key, value);
      }) && _.every(_.omit(collection.rejects || {}, indexTests), function(value, key) {
        return !collection._test(item, key, value);
      });
    });

    return _.filter(firstPass, function(item, index, items) {
      return _.every(_.pick(collection.filters || {}, indexTests), function(value, key) {
        return collection._testIndex(index, items.length, key, value);
      }) && _.every(_.pick(collection.rejects || {}, indexTests), function(value, key) {
        return !collection._testIndex(index, items.length, key, value);
      });
    });
  },

  list: function(key) {
    key = key || 'name';
    return _.map(this.items(), function(item) {
      return item.get(key);
    }, this);
  },

  first: function(n) {
    return this.where({ first: n===undefined ? 1: n });
  },

  last: function(n) {
    return this.where({ last: n===undefined ? 1: n });
  },

  nth: function(n) {
    return this.where({ nth: n });
  },

  clone: function(extension) {
    return _.extend(_.clone(this), extension);
  },

  size: function() {
    if (this.singular) {
      return this.where.apply(this, arguments) ? 1 : 0;
    }
    return this.where.apply(this, arguments).items().length;
  },

  one: function() {
    return this.where.apply(this, arguments).items()[0];
  },

  the: function() {
    return this.one.apply(this, arguments);
  },

  some: function() {
    return this.where.apply(this, arguments).items().length > 0;
  },

  none: function() {
    return this.where.apply(this, arguments).items().length == 0;
  },

  each: function(fn) {
    return _.each(this.items(), fn, this.game);
  },

  map: function(fn) {
    return _.map(this.items(), fn, this.game);
  },

  sum: function(key) {
    return _.reduce(this.items(), function(memo, item) { return memo + item.get(key); }, 0);
  },

  highest: function(key) {
    return _.max(this.items(), function(item) { return item.get(key); });
  },

  lowest: function(key) {
    return _.min(this.items(), function(item) { return item.get(key); });
  },

  shuffle: function() {
    this._unscoped = _.shuffle(this._unscoped);
  },

  _testIndex: function(index, length, key, value) {
    if (key=='nth') { return index==value-1; }
    if (key=='first') { return index < value; }
    if (key=='last') { return index >= length - value; }
  },

  _test: function(item, key, value) {
    if (value===null) { return true; }
    if (key=='in') { return _.isArray(value) ? _.contains(value, item.parent) : item.parent==value; } // should recurse 
    if (key=='with') { return value.parent ? value.parent==item : item.some(value); } 
    return item.get(key) == value;
  },

  // voodoo magic
  _bindWhere: function() {
    var bound = _.extend(function() {
      return this.where.apply(bound, arguments);
    }, this);
    return bound;
  }
};

var Game = exports.Game = function(name) {
  var game = this;
  this.name = name;
  this.game = this;
  this._pieceNames = []; // array of all Piece names [singular, plural]
  this._pieces = []; // array of all pieces
  this._spaces = []; // array of all pieces
  this._players = []; // array of all pieces
  this.pieces = new Pieces({ game: this }); // collection of all pieces
  this.spaces = new Spaces({ game: this }); // collection of all spaces
  this.players = new Players({ game: this }); // collection of all spaces
  this.piece = new Pieces({ game: this, singular: true }); // collection of all pieces
  this.space = new Spaces({ game: this, singular: true }); // collection of all spaces
  this.player = new Players({ game: this, singular: true }); // collection of all spaces
  this.singular = true;
};

_.extend(Game.prototype, CanHavePieces, CanHaveSpaces, Collection, {

  hasPlayers: function(players) {
    if (_.isArray(players)) {
      _.each(players, function(player) {
        this._players.push(new Player({ game: this, name: player }));
      });
    } else if (_.isNumber(players)) {
      _(players).times(function(index) {
        this._players.push(new Player({ game: this, name: index + 1 }));
      }, this);
    }
  },

  pieceType: function(type) {
    return _.find(this._pieceNames, function(name) {
      return type==name[0] || type==name[1];
    });
  },

  singularPieceType: function(type) {
    var piece = this.pieceType(type);
    return piece ? piece[0] : null;
  },

  pluralPieceType: function(type) {
    var piece = this.pieceType(type);
    return piece ? piece[1] : null;
  }
});

var Players = exports.Players = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this._unscoped = this.game._players;
  return this._bindWhere();
};

_.extend(Players.prototype, CanHaveSpaces, CanHavePieces, Collection, {
  win: function() { },

  hasSpaces: function() {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpaces.apply(player, args);
    });
    return this;
  },

  hasSpace: function() {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpace.apply(player, args);
    });
    return this;
  },

  hasPieces: function() {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPieces.apply(player, args);
    });
    return this;
  },

  hasPiece: function() {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPiece.apply(player, args);
    });
    return this;
  }
});

var Pieces = exports.Pieces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this._unscoped = this.game._pieces;
  if (options.in) { this.filters.in = options.in; }
  if (options.type) { this.filters.type = options.type; }
  if (options.owner) { this.filters.owner = options.owner; }
  return this._bindWhere();
};

_.extend(Pieces.prototype, Collection, {
  moveTo: function(space) {
    var pieces = this.items();
    if (_.isArray(pieces)) {
      _.each(pieces, function(piece) { piece.moveTo(space); });
    } else {
      pieces.moveTo(space);
    }
  }
});

var Spaces = exports.Spaces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this._unscoped = this.game._spaces;
  if (options.type) { this.filters.type = options.type; }
  if (options.owner) { this.filters.owner = options.owner; }
  return this._bindWhere();
};

_.extend(Spaces.prototype, Collection, {
  holds: function(pieces) {
    this.held = pieces;
    if (pieces) {
      _.each(_.isArray(pieces) ? pieces : [pieces], function(piece) {
        var type = this.game.singularPieceType(piece);
        if (!type) {
          throw(this.name + " cannot hold '" + piece + "'. No such piece.");
        }
        this[piece] = new Pieces({
          game: this.game,
          in: this.items(),
          type: type,
          singular: piece==type
        });
      }, this);
    }
    return this;
  },

  clone: function(extension) {
    // rebuild holds relationships
    return Collection.clone.apply(this, arguments).holds(this.held);
  },
});

var Item = {
  get: function(key) {
    return _.isFunction(this[key]) ? this[key].apply(this) : this[key];
  },
};

var Player = exports.Player = function(options) {
  this.game = options.game;
  this.name = options.name;
};

_.extend(Player.prototype, CanHaveSpaces, CanHavePieces, Collection);

var Piece = exports.Piece = function(options) {
  this.game = options.game;
  this.type = options.type;
  this.name = options.name;
  this.owner = options.owner;
};

_.extend(Piece.prototype, Item, {
  moveTo: function(space) {
    var pieceType = this.game.pieceType(this.type);
    if (!pieceType) {
      throw("no such piece '" + this.type + "'");
    }
    if (!space) {
      throw("no such space");
    }
    if (!space[pieceType[0]] && !space[pieceType[1]]) {
      throw("'" + space.name + "' does not hold '" + this.type + "'");
    }
    if (!space[pieceType[1]] && space[pieceType[0]].size()==1) {
      throw(space.name + " can only hold one '" + this.type + "'");
    }
    this.parent = space;
  }
});

var Space = exports.Space = function(options) {
  this.game = options.game;
  this.name = options.name;
  this.owner = options.owner;
  this.pieces = new Pieces({
    game: this.game,
    in: this
  });
  // delegate all collection methods to pieces
  _.chain(Collection).functions().each(function(key) {
    this[key] = this.pieces[key].bind(this.pieces);
  }, this);
  this.where = this.pieces.where; // do not bind this as where is already bound
};

_.extend(Space.prototype, Item, {
  holds: function(pieces) {
    if (pieces) {
      _.each(_.isArray(pieces) ? pieces : [pieces], function(piece) {
        var type = this.game.singularPieceType(piece);
        if (!type) {
          throw(this.name + " cannot hold '" + piece + "'. No such piece.");
        }
        this[piece] = new Pieces({
          game: this.game,
          in: this,
          type: type,
          singular: piece==type
        });
        if (piece!=type) {
          this[type] = new Pieces({
            game: this.game,
            in: this,
            type: type,
            singular: true
          });
        }
      }, this);
      return this;
    }
  }
});
