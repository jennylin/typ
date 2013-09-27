/**

how pass filters down the chain?
e.g. hands(player:1).cards(suit:...)

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
  hasPlayer(n)
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
  within([string name], [hash attributes]) // return pieces within a space by filter

Piece // piece instance
  moveTo(space)

*/

var _ = require('underscore');

var Game = module.exports.Game = function() {
  var game = this;
  this._pieceNames = []; // array of all Piece names [singular, plural]
  this._pieces = []; // array of all pieces
  this._spaces = []; // array of all pieces

  this.pieces = new Pieces({ game: this }); // collection of all pieces
  this.spaces = new Spaces({ game: this }); // collection of all spaces
};

_.extend(Game.prototype, {

  /**
   * create space root node and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece
   * collection and creates reference to piece collection on this space
   */
  hasSpace: function(name, holds) {
    this[name] = this.createSpace(name).holds(holds);
    return this;
  },

  hasSpaces: function(singular, plural, number, holds) {
    var game = this
    , spaces = [];

    _(number).times(function() {
      spaces.push(game.createSpace(singular).holds(holds));
    });

    this[plural] = new Spaces({
      game: this,
    }).holds(holds);
    this[singular] = new Spaces({
      game: this,
      singular: true
    }).holds(holds);
    return this;
  },

  /**
   * Create pieces instances and create reference to collection with plural name
   */
  hasPieces: function(singular, plural, names, methods) { // names e.g.: ['2C',...], { wheat: 3,... }
    var game = this
    , pieces = [];

    this._pieceNames.push([singular, plural]);

    if (_.isNumber(names)) {
      names = { singular: names };
    }

    _.each(names, function(value, key) {
      if (_.isNumber(value)) {
        _(value).times(function() {
          pieces.push(game.createPiece(singular, key, methods));
        });
      } else {
        pieces.push(game.createPiece(singular, value, methods));
      }
    });

    this[plural] = new Pieces({
      game: this,
      type: singular
    });
    this[singular] = new Pieces({
      game: this,
      type: singular,
      singular: true
    });
    return this;
  },

  /**
   * Create piece instance and create reference to instance with name
   */
  hasPiece: function(name, methods) {
    var game = this;
    this[name] = game.createPiece(name, name, methods);
    return this;
  },

  createPiece: function(type, name, methods) {
    var piece = _.extend(new Piece({game: this, type: type, name: name }), methods);
    this._pieces.push(piece);
    return piece;
  },

  createSpace: function(name) {
    var space = new Space({ game: this, name: name });
    this._spaces.push(space);
    return space;
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

var Collection = {
  where: function(name, query, reject) {
    if (_.isNumber(name)) {
      query = _.extend(query || {}, { nth: name });
      this.singular = true;
    } else if (_.isString(name)) {
      query = _.extend(query || {}, { name: name });
    } else {
      query = name;
    }
    if (query===undefined) {
      filtered = this;
    } else {
      _.extend(query, this[reject ? 'rejects' : 'filters']);
      filtered = this.clone();
      filtered[reject ? 'rejects' : 'filters'] = query;
    }
    if (this.singular) {
      debugger;
      return filtered.items()[0];
    }
    return filtered;
  },

  except: function(name, query) {
    return this.where(name, query, true);
  },

  items: function() {
    var collection = this;
    return _.filter(this.unscoped, function(item, index, items) {
      return _.every(collection.filters, function(value, key) {
        return collection._test(item, index, items, key, value);
      }) && _.every(collection.rejects, function(value, key) {
        return !collection._test(item, index, items, key, value);
      });
    });
  },

  list: function(key) {
    key = key || 'name';
    return _.map(this.items(), function(item) {
      return item.get(key);
    }, this);
  },

  clone: function() {
    return _.clone(this);
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

  _test: function(item, index, items, key, value) {
    if (key=='first') { return index < value; }
    if (key=='nth') { return index==value-1; }
    if (key=='last') { return index >= items.length - value; }
    if (key=='in') { return _.isArray(value) ? _.contains(value, item.parent) : item.parent==value; } // should recurse
    return item.get(key) == value;
  },

  _bindWhere: function() {
    return _.extend(this.where.bind(this), this);
  }
};

var Pieces = module.exports.Pieces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this.unscoped = this.game._pieces;
  if (options.in) { this.filters.in = options.in; }
  if (options.type) { this.filters.type = options.type; }
  return this._bindWhere();
};

_.extend(Pieces.prototype, Collection, {
  move: function() {
    var query = arguments
    , pieces = this;
    return {
      to: function(space) {
        return pieces.where.apply(pieces, query).each(function(piece) { piece.moveTo(space); });
      }
    };
  }      
});

var Spaces = module.exports.Spaces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this.unscoped = this.game._spaces;
  if (options.type) { this.filters.type = options.type; }
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

  clone: function() {
    // rebuild holds relationships
    return _.clone(this).holds(this.held);
  },
});

var Item = {
  get: function(key) {
    return _.isFunction(this[key]) ? this[key].apply(this) : this[key];
  },
};

var Piece = module.exports.Piece = function(options) {
  this.game = options.game;
  this.type = options.type;
  this.name = options.name;
  this.player = options.player;
};

_.extend(Piece.prototype, Item, {
  moveTo: function(space) {
    var pieceType = this.game.pieceType(this.type);
    if (!pieceType) {
      throw("no such piece '" + this.type + "'");
    }
    if (!space[pieceType[0]] && !space[pieceType[1]]) {
      throw(space.name + " does not hold '" + this.type + "'");
    }
    if (!space[pieceType[1]] && space[pieceType[0]].size()==1) {
      throw(space.name + " can only hold one '" + this.type + "'");
    }
    this.parent = space;
  }      
});

var Space = module.exports.Space = function(options) {
  this.game = options.game;
  this.name = options.name;
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
  },
});
