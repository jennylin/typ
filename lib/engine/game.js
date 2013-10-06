/**
TODO:
 recursion: spaces->spaces, pieces->pieces ?
 filter.owner remove?
 inflection
 collection->collection
 any cleanup

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

  _items() // returns array of matching items
  each(fn)
  map(fn)
  list(attr) // _.pluck
  sum(attr)
  one([name], [hash])
  highest(attr), lowest(attr)
  shuffle
  sort(attr)
  quantity
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

var root = this, GameEngine;

if (typeof exports !== 'undefined') {
  GameEngine = exports;
  var _ = require('underscore')
  , $ = require('jquery')
  , inflection = require('inflection')
  , xmlbuilder = require('xmlbuilder');
} else {
  GameEngine = root.GameEngine = {};
  _ = root._;
}

CanHaveSpaces = {
  /**
   * create space root node and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece
   * collection and creates reference to piece collection on this space
   */
  hasSpace: function(name, holds) {
    if (!name) { throw('hasSpace requires a space name'); }

    this[inflection.singularize(name)] = this._createSpace(name, holds);
    return this;
  },

  hasSpaces: function(name, number, holds) {
    if (!name) { throw('hasSpaces requires a space name'); }
    if (number < 1) { throw('hasSpaces requires a number of spaces'); }

    _(number).times(function() {
      this._createSpace(name, holds);
    }, this);

    this[inflection.pluralize(name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(name),
      owner: this
    }).holds(holds);
    this[inflection.singularize(name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(name),
      singular: true,
      owner: this
    }).holds(holds);

    return this;
  },

  _createSpace: function(name, holds) {
    Game._noReservedWords(inflection.singularize(name));
    Game._noReservedWords(inflection.pluralize(name));

    var space = new Space({ game: this.game, name: inflection.singularize(name), owner: this }).holds(holds);
    this.game._spaces.push(space);

    // create collections on game node for easy access to nested spaces
    if (this!==this.game) {
      this.game[inflection.pluralize(name)] = new Spaces({
        game: this.game,
        type: inflection.singularize(name)
      }).holds(holds);
      if (inflection.pluralize(name)!=inflection.singularize(name)) {
        this.game[inflection.singularize(name)] = new Spaces({
          game: this.game,
          type: inflection.singularize(name),
          singular: true
        }).holds(holds);
      }
    }

    return space;
  },
};

CanHavePieces = {
  /**
   * Create pieces instances and create reference to collection with plural name
   */
  hasPieces: function(type, names, methods) { // names e.g.: ['2C',...], { wheat: 3,... }
    if (!type) { throw('hasPieces requires a piece type'); }
    if (!_.isNumber(names) && !_.isArray(names)
        && (!_.isObject(names) || !_.every(names, function(n) { return _.isNumber(n); }))) {
      throw('hasPieces requires a number of pieces or list of piece names');
    }

    this.game._pieceNames.push([inflection.singularize(type), inflection.pluralize(type)]);

    if (_.isNumber(names)) {
      var tmp = {};
      tmp[inflection.singularize(type)] = names;
      names = tmp;
    }

    _.each(names, function(value, key) {
      if (_.isNumber(value)) {
        _(value).times(function() {
          this._createPiece(type, key, methods);
        }, this);
      } else {
        this._createPiece(type, value, methods);
      }
    }, this);

    this[inflection.pluralize(type)] = new Pieces({
      game: this.game,
      type: inflection.singularize(type),
      owner: this
    });
    if (inflection.pluralize(type)!=inflection.singularize(type)) {
      this[inflection.singularize(type)] = new Pieces({
        game: this.game,
        type: inflection.singularize(type),
        singular: true,
        owner: this
      });
    }
    return this;
  },

  /**
   * Create piece instance and create reference to instance with name
   */
  hasPiece: function(type, methods) {
    if (!type) { throw('hasPiece requires a piece type'); }

    this[inflection.singularize(type)] = this._createPiece(type, inflection.singularize(type), methods);
    return this;
  },

  _createPiece: function(type, name, methods) {
    type = inflection.singularize(type);
    Game._noReservedWords(type);
    Game._noReservedWords(name);

    var piece = _.extend(new Piece({
      game: this.game,
      type: type,
      name: name,
      owner: this,
      attributes: _.keys(methods)
    }), methods);
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
      if (query) {
        throw("Can't search " + this._name + " by 2 different filters");
      }
      query = name;
    }
    if (query===undefined) {
      filtered = this;
    } else {
      var refinements = {};
      if (_.isObject(query) && query.contains) { // filter by an item instance
        refinements[reject ? 'rejectItem' : 'filterItem'] = query;
      } else {
        refinements[reject ? 'rejects' : 'filters'] = _.extend(_.clone(this[reject ? 'rejects' : 'filters']) || {}, query);
      }
      filtered = this.clone(refinements);
    }
    if (filtered.singular || filtered.filters.first==1 || filtered.filters.last==1 || filtered.filters.nth!==undefined) {
      return filtered._items()[0];
    }
    return filtered;
  },

  except: function(name, query) {
    return this.where(name, query, true);
  },

  _items: function() {
    var collection = this;

    var indexTests = ['first', 'last', 'nth'];

    var firstPass = _.filter(this._unscoped, function(item) {
      return _.every(_.omit(collection.filters || {}, indexTests), function(value, key) {
        return collection._test(item, key, value);
      }) && _.every(_.omit(collection.rejects || {}, indexTests), function(value, key) {
        return !collection._test(item, key, value);
      });
    });

    if (this.rejectItem) {
      firstPass = _.without(firstPass, this.rejectItem);
    }

    if (this.filterItem) {
      firstPass = _.contains(firstPass, this.filterItem) ? [this.filterItem] : [];
    }

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
    return _.map(this._items(), function(item) {
      return item.get(key);
    }, this);
  },

  first: function(n) {
    if (n!==undefined && n < 1) { throw("Can't search " + this._name + " by first " + n); }
    if (n > this.quantity()) { throw("Can't get first " + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ first: n===undefined ? 1: n });
  },

  last: function(n) {
    if (n!==undefined && n < 1) { throw("Can't search " + this._name + " by last " + n); }
    if (n > this.quantity()) { throw("Can't get last " + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ last: n===undefined ? 1: n });
  },

  nth: function(n) {
    if (n < 1) { throw("Can't search " + this._name + " by number " + n); }
    if (n > this.quantity()) { throw("Can't get item #" + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ nth: n });
  },

  clone: function(extension) {
    return _.extend(_.clone(this), extension);
  },

  quantity: function() {
    if (this.singular) {
      return this.where.apply(this, arguments) ? 1 : 0;
    }
    return this.where.apply(this, arguments)._items().length;
  },

  one: function() {
    return this.where.apply(this, arguments)._items()[0];
  },

  the: function() {
    return this.one.apply(this, arguments);
  },

  some: function() {
    return this.where.apply(this, arguments)._items().length > 0;
  },

  none: function() {
    return this.where.apply(this, arguments)._items().length == 0;
  },

  each: function(fn) {
    return _.each(this._items(), fn, this.game);
  },

  map: function(fn) {
    return _.map(this._items(), fn, this.game);
  },

  sum: function(key) {
    return _.reduce(this._items(), function(memo, item) { return memo + item.get(key); }, 0);
  },

  highest: function(key) {
    if (!_.isString(key)) { throw "highest needs an attribute name to sort by"; }
    if (this._items().length==0) { return undefined; }
    return _.max(this._items(), function(item) { return item.get(key); });
  },

  lowest: function(key) {
    if (!_.isString(key)) { throw "lowest needs an attribute name to sort by"; }
    if (this._items().length==0) { return undefined; }
    return _.min(this._items(), function(item) { return item.get(key); });
  },

  shuffle: function() {
    this._unscoped = _.shuffle(this._unscoped); // - cant re-assign this or it loses future changes
  },

  _testIndex: function(index, length, key, value) {
    if (key=='nth') { return index==value-1; }
    if (key=='first') { return index < value; }
    if (key=='last') { return index >= length - value; }
  },

  _test: function(item, key, value) {
    if (value===null) { return true; }
    if (key=='in') { // item is child, value is item or collection or array of items
      if (_.isArray(value)) {
        return _.any(value, function(v) { return v.contains(item); });
      }
      if (_.isObject(value)) {
        if (value.contains) {
          return value.contains(item);
        }
        if (value._items) { 
          return _.any(value._items(), function(v) { return v.contains(item); });
        }
      }
      throw("not a valid container for 'in'");
    }
    if (key=='with') { // item is parent, value is item or where query
      if (_.isObject(value) && value.contains) { // better test for extends Item?
          return item.contains(value);
      }
      return _.any(this.where.call(this.game.pieces, value)._items(), function(v) { return item.contains(v); });
    }
    return item.get(key) == value || (_.isArray(value) && _.contains(value, item.get(key)));
  },

  // voodoo magic - bind functions return value to itself
  _bindWhere: function() {
    var bound = _.extend(function() {
      return bound.where.apply(bound, arguments);
    }, this);
    return bound;
  }
};

var Game = GameEngine.Game = function(name) {
  var game = this;
  this.name = name;
  this.game = this;
  this._pieceNames = []; // all Piece names [singular, plural]
  this._pieces = []; // all pieces
  this._spaces = []; // all pieces
  this._players = []; // all pieces
  this._moves = []; // all moves
  this._phases = []; // all phase callbacks
  this.pieces = new Pieces({ game: this }); // collection of all pieces
  this.spaces = new Spaces({ game: this }); // collection of all spaces
  this.players = new Players({ game: this }); // collection of all spaces
  this.piece = new Pieces({ game: this, singular: true }); // collection of all pieces
  this.space = new Spaces({ game: this, singular: true }); // collection of all spaces
  this.player = new Players({ game: this, singular: true }); // collection of all spaces
};

_.extend(Game.prototype, CanHavePieces, CanHaveSpaces, {

  hasPlayers: function(players) {
    if (_.isArray(players)) {
      _.each(players, function(player, number) {
        this._players.push(new Player({ game: this, name: player, position: number }));
      });
    } else if (_.isNumber(players)) {
      _(players).times(function(index) {
        this._players.push(new Player({ game: this, name: 'Player ' + (index + 1), position: index }));
      }, this);
    } else {
      throw("players must be number or list");
    }
    return this;
  },

  hasMoves: function(moves) {
    _.each(moves, function(move, name) {
      this._moves[name] = new Move(_.extend(move, { name: this.name, game: this.game }));
    }, this);
  },

  _pieceType: function(type) {
    return _.find(this._pieceNames, function(name) {
      return type==name[0] || type==name[1];
    });
  },

  _singularPieceType: function(type) {
    var piece = this._pieceType(type);
    return piece ? piece[0] : null;
  },

  _pluralPieceType: function(type) {
    var piece = this._pieceType(type);
    return piece ? piece[1] : null;
  },

  when: function(phase, fn) {
    if (!_.isString(phase)) { throw ("when phase " + phase + " must be a name"); }
    if (!_.isFunction(fn)) { throw ("when phase " + phase + " must provide a function"); }

    this._phases[phase] = fn;
  },

  become: function(phase) {
    console.log('Phase ' + phase);
    if (_.isFunction(this._phases[phase])) {
      this._phases[phase].apply(this, _.toArray(arguments).slice(1));
    } else {
      throw("can't become " + phase);
    }
  },
});

Game._noReservedWords = function(word) {
  if (_.contains('piece', 'space', 'when', 'become')) {
    throw(word + ' is a reserved word');
  }
};

var Players = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this._unscoped = this.game._players;
  this._name = "players";
  this._spaces = []; // list of space types owned, tuples of space/pieces
  this._pieces = []; // list of piece types owned

  return this._bindWhere();
};

_.extend(Players.prototype, Collection, {
  haveSpaces: function(name, number, holds) {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpaces.apply(player, args);
    });
    this._spaces.push([name, holds]);
    return this.assignSpaces();
  },

  haveSpace: function(name, holds) {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpace.apply(player, args);
    });
    this._spaces.push([name, holds]);
    return this.assignSpaces();
  },

  havePieces: function(type) {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPieces.apply(player, args);
    });
    this._pieces.push(type);
    return this.assignPieces();
  },

  havePiece: function(type) {
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPiece.apply(player, args);
    });
    this._pieces.push(type);
    return this.assignPieces();
  },

  assignSpaces: function() {
    _.each(this._spaces, function(spaceHold) {
      this[inflection.pluralize(spaceHold[0])] = new Spaces({
        game: this.game,
        type: inflection.singularize(spaceHold[0]),
        in: this._items()
      }).holds(spaceHold[1]);
    }, this);
    return this;
  },

  assignPieces: function() {
    _.each(this._pieces, function(piece) {
      this[inflection.pluralize(piece)] = new Pieces({
        game: this.game,
        type: inflection.singularize(piece),
        owner: this._items()
      });
    }, this);
    return this;
  },

  clone: function(extension) {
    // rebuild holds relationships
    return Collection.clone.apply(this, arguments).assignSpaces().assignPieces();
  },

  cannotSee: function(fn) {
    this.cannotSeeItems = fn;
  },

  must: function() {
    // TODO
    var game = this.game;
    return {
      then: function(fn) {
        //fn.apply(game, arguments);
      }
    };
  },

  may: function() {
    // TODO
  }
});

var Pieces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this._unscoped = this.game._pieces;
  if (options.in) { this.filters.in = options.in; }
  if (options.type) { this.filters.type = options.type; }
  if (options.owner) { this.filters.owner = options.owner; }
  this._name = (options.singular ? 'single ' : 'set ') + (options.type || 'piece') + (options.owner ? ' of ' + options.owner.name : '') + (options.in ? ' in ' + options.in._name : '');
  return this._bindWhere();
};

_.extend(Pieces.prototype, Collection, {
  moveTo: function(space) {
    var pieces = this._items();
    if (!pieces || (_.isArray(pieces) && pieces.length==0)) {
      throw("no pieces available to move from " + this._name + " to " + space.name);
    }
    if (_.isArray(pieces)) {
      _.each(pieces, function(piece) { piece.moveTo(space); });
    } else {
      pieces.moveTo(space);
    }
  }
});

var Spaces = function(options) {
  this.game = options.game;
  this.filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this._unscoped = this.game._spaces;
  if (options.in) { this.filters.in = options.in; }
  if (options.type) { this.filters.name = options.type; }
  if (options.owner) { this.filters.owner = options.owner; }
  this._name = (options.singular ? 'single ' : 'set ') + (options.type || 'space') + ' in ' + (options.owner ? options.owner.name : 'game');
  return this._bindWhere();
};

_.extend(Spaces.prototype, Collection, {
  holds: function(pieces, plural) {
    this.held = pieces;
    if (pieces) {
      _.each(_.isArray(pieces) ? pieces : [pieces], function(piece) {
        var type = this.game._singularPieceType(piece);
        if (!this.singular) {
          piece = inflection.pluralize(piece);
        }
        if (!type) {
          throw(this._name + " cannot hold '" + piece + "'. No such piece.");
        }
        this[piece] = new Pieces({
          game: this.game,
          in: this._items(),
          type: type,
          singular: piece==type && this.singular
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
    if (this[key]===undefined) { throw(this.name + " has no " + key); }

    return _.isFunction(this[key]) ? this[key].apply(this) : this[key];
  },

  contains: function(item) {
    return item.parent && (item.parent==this || this.contains(item.parent));
  }
};

var Player = function(options) {
  this.game = options.game;
  this.name = options.name;
  this.position = options.position;
  this.pieces = new Pieces({ game: this.game, in: this });
  this.spaces = new Spaces({ game: this.game, in: this });
};

_.extend(Player.prototype, CanHaveSpaces, CanHavePieces, Item, {
  win: function() { },

  canSee: function(piece) {
    return _.every(this.game.players.cannotSeeItems.call(this.game, this), function(items) {
      if (items==piece) { return false; }
      if (_.isArray(items) && _.contains(items, piece)) { return false; }
      if (_.isObject(items) && items.where && items.some(piece)) { return false; }
      return true;
    });
  },

  after: function() {
    return this.game._players[(this.position+1) % this.game._players.length];
  },

  must: function(name, fn) {
    var move = this.game._moves[name];
    if (!move) { throw('no such move ' + name); }
    if (!_.isFunction(fn)) { throw('must have function after move ' + name); }

    _.clone(move).prompt(this).then(function(move) {
      fn.call(move.game, move);
    });
  },

  may: function() {
    // TODO
  }
});

var Piece = function(options) {
  this.game = options.game;
  this.type = options.type;
  this.name = options.name;
  this.owner = options.owner;
  this.attributes = options.attributes;
};

_.extend(Piece.prototype, Item, {
  moveTo: function(space) {
    var pieceType = this.game._pieceType(this.type);
    if (!pieceType) {
      throw("no such piece '" + this.type + "'");
    }
    if (!space) {
      throw("no such space");
    }
    if (!space[pieceType[0]] && !space[pieceType[1]]) {
      throw("'" + space.name + "' does not hold '" + this.type + "'");
    }
    if (!space[pieceType[1]] && space[pieceType[0]].quantity()==1) {
      throw(space.name + " can only hold one '" + this.type + "'");
    }
    this.parent = space;
  }
});

var Space = function(options) {
  this.game = options.game;
  this.name = options.name;
  this.owner = options.owner;
  this.parent = options.owner;
  this.pieces = new Pieces({ game: this.game, in: this });
  // delegate all collection methods to pieces
  _.chain(Collection).functions().each(function(key) {
    this[key] = this.pieces[key].bind(this.pieces);
  }, this);
  this.where = this.pieces.where; // do not bind this, let _bindWhere bind this one
};

_.extend(Space.prototype, Item, {
  holds: function(pieces) {
    if (pieces) {
      _.each(_.isArray(pieces) ? pieces : [pieces], function(piece) {
        var singular = this.game._singularPieceType(piece);
        if (!singular) {
          throw(this.name + " cannot hold '" + piece + "'. No such piece.");
        }
        this[piece] = new Pieces({
          game: this.game,
          in: this,
          type: singular,
          singular: piece==singular
        });
        if (piece!=singular) {
          this[singular] = new Pieces({
            game: this.game,
            in: this,
            type: singular,
            singular: true
          });
        }
      }, this);
      return this;
    }
  }
});

var Move = function(options) {
  this.description = options.description;
  this.choices = options.pieces || options.piece;
  this.quantity = options.quantity || 1;
  this.to = options.to;
  this.valid = options.valid;
  this.game = options.game;
  this.name = options.name;
};

_.extend(Move.prototype, {
  prompt: function(player) {

    if (this.game.dom) {
      this.game.dom.html(new GameEngine.GameXML(this.game, player));
      this.game.dom.find('*').each(function() {
        $(this).prepend($('<span>', { class: 'name' }).html($(this).attr('name') || inflection.humanize(this.tagName)));
      });
    }

    this.player = player;
    var pieces = this.choices.call(this.game, this);
    if (pieces.none()) {
      throw("no valid pieces to move for " + this.name);
    }

    var deferred = Q.defer();

    bootbox.prompt({
      title: this.player.name + "<br><br>" + this.description + "<br><br>" + pieces.list().join(', '),
      animate: false,
      callback: function(piece) {
        if (!piece) {
          return false;
        }
        this.piece = pieces(piece).first();
        console.log(this.piece);
        if (!this.piece) {
          bootbox.alert(piece + " is not an option");
          return false;
        }
        if (!this.valid.call(this.game, this)) {
          bootbox.alert({
            message: piece + " is not a valid option",
            animate: false
          });
          return false;
        }
        this.piece.moveTo(this.to.call(this.game, this));
        deferred.resolve(this);
      }.bind(this)
    });
    return deferred.promise;
  }
});

var GameXML = GameEngine.GameXML = function(game, player) {
  this.game = game;
  this.player = player;

  var board = $('<board>')
  , xml = this;

  this.game.players.each(function(player) {
    xml.addNode($('<player>', { class: 'player', name: player.name }).appendTo(board) , player);
  });

  return this.addNode(board, this.game);

};

_.extend(GameXML.prototype, {
  addNode: function(node, parent) {
    _.each(_.where(this.game._spaces, { parent: parent }), function(space) {
      var $el = $('<' + space.name + '>', { class: 'space' });
      if (space.owner && space.owner.name && space.owner.position) { $el.attr('player', space.owner.name); }
      this.addNode($el.appendTo(node), space);
    }, this);

    _.each(_.where(this.game._pieces, { parent: parent }), function(piece) {
      var $el = $('<' + piece.type + '>', { class: 'piece' });
      if (!this.player || this.player.canSee(piece)) {
        $el.attr('name', piece.name);
        _.each(piece.attributes, function(attr) {
          $el.attr(attr, piece.get(attr));
        });
      }
      if (piece.owner && piece.owner.name && piece.owner.position) { $el.attr('player', piece.owner.name); }
      this.addNode($el.appendTo(node), piece);
    }, this);
    return node;
  }
});
