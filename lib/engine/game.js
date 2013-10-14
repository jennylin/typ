/**
TODO:
 recursion: spaces->spaces, pieces->pieces ?
 1-option move handling
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

  all() // returns array of matching items
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
  , inflection = require('inflection');
} else {
  GameEngine = root.GameEngine = {};
  _ = root._;
}

CanHaveSpaces = {
  /**
   * create space root node and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece
   * collection and creates reference to piece collection on this space
   */
  hasSpace: function(name, holds, methods) {
    if (!name) { throw('hasSpace requires a space name'); }
    if (!methods && _.isObject(holds) && !_.isArray(holds)) {
      methods = holds;
      holds = undefined;
    }
    this[inflection.singularize(name)] = this._createSpace(name, holds, methods);
    return this;
  },

  hasSpaces: function(name, number, holds, methods) {
    if (!name) { throw('hasSpaces requires a space name'); }
    if (!_.isNumber(number) || number < 1) { throw('hasSpaces requires a number of spaces'); }
    if (!methods && _.isObject(holds) && !_.isArray(holds)) {
      methods = holds;
      holds = undefined;
    }

    _(number).times(function(position) {
      this._createSpace(name, holds, methods, position);
    }, this);

    this[inflection.pluralize(name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(name),
      owner: this
    })._holds(holds);
    this[inflection.singularize(name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(name),
      singular: true,
      owner: this
    })._holds(holds);

    return this;
  },

  _createSpace: function(name, holds, methods, position) {
    Game._validateName(inflection.singularize(name));
    Game._validateName(inflection.pluralize(name));
    var space = _.extend(
      new Space({
        game: this.game,
        name: inflection.singularize(name),
        position: position,
        owner: this,
        attributes: methods ? _.keys(methods) : undefined
      })._holds(holds),
      methods
    );
    this.game._spaces.push(space);

    // create collections on game node for easy access to nested spaces
    if (this!==this.game) {
      this.game[inflection.pluralize(name)] = new Spaces({
        game: this.game,
        type: inflection.singularize(name)
      })._holds(holds);
      if (inflection.pluralize(name)!=inflection.singularize(name)) {
        this.game[inflection.singularize(name)] = new Spaces({
          game: this.game,
          type: inflection.singularize(name),
          singular: true,
          attributes: methods ? _.keys(methods) : undefined
        }, methods)._holds(holds);
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

    this.game._pieceNames.push([inflection.singularize(type), inflection.pluralize(type)]);
    this[inflection.singularize(type)] = this._createPiece(type, inflection.singularize(type), methods);
    return this;
  },

  _createPiece: function(type, name, methods) {
    type = inflection.singularize(type);
    Game._validateName(type);

    var piece = _.extend(new Piece({
      game: this.game,
      type: type,
      name: name,
      owner: this,
      attributes: methods ? _.keys(methods) : undefined
    }), methods);
    this.game._pieces.push(piece);
    return piece;
  }
};

var Collection = {
  _isCollection: true,
  
  where: function(name, query, reject) {
    if (_.isFunction(name)) {
      return this.where(_.filter(this.all(), function(other) {
        return name.call(this.game, other) ^ reject;
      }, this));
    }
    if (_.isNumber(name)) {
      query = _.extend(query || {}, { nth: name });
    } else if (_.isString(name) || _.isArray(name)) {
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
      if (_.isObject(query) && query._isItem) { // filter by an item instance
        refinements[reject ? '_rejectItem' : '_filterItem'] = query;
      } else {
        refinements[reject ? '_rejects' : '_filters'] = _.extend(_.clone(this[reject ? '_rejects' : '_filters']) || {}, query);
      }
      filtered = this._clone(refinements);
    }
    if (filtered.singular || filtered._filters.first==1 || filtered._filters.last==1 || filtered._filters.nth!==undefined) {
      return filtered.all()[0];
    }
    return filtered;
  },

  except: function(name, query) {
    return this.where(name, query, true);
  },

  all: function() {
    var collection = this;

    var indexTests = ['first', 'last', 'nth'];

    var firstPass = _.filter(this._unscoped, function(item) {
      return _.every(_.omit(collection._filters || {}, indexTests), function(value, key) {
        return collection._test(item, key, value);
      }) && _.every(_.omit(collection._rejects || {}, indexTests), function(value, key) {
        return !collection._test(item, key, value);
      });
    });

    if (this._rejectItem) {
      firstPass = _.without(firstPass, this._rejectItem);
    }

    if (this._filterItem) {
      firstPass = _.contains(firstPass, this._filterItem) ? [this._filterItem] : [];
    }

    return _.filter(firstPass, function(item, index, items) {
      return _.every(_.pick(collection._filters || {}, indexTests), function(value, key) {
        return collection._testIndex(index, items.length, key, value);
      }) && _.every(_.pick(collection._rejects || {}, indexTests), function(value, key) {
        return !collection._testIndex(index, items.length, key, value);
      });
    });
  },

  list: function(key) {
    key = key || 'name';
    return _.map(this.all(), function(item) {
      return item.get(key);
    }, this);
  },

  first: function(n) {
    if (n!==undefined && (!_.isNumber(n) || n < 1)) { throw("Can't search " + this._name + " by first " + n); }
    if (n > this.quantity()) { throw("Can't get first " + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ first: n===undefined ? 1: n });
  },

  last: function(n) {
    if (n!==undefined && (!_.isNumber(n) || n < 1)) { throw("Can't search " + this._name + " by last " + n); }
    if (n > this.quantity()) { throw("Can't get last " + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ last: n===undefined ? 1: n });
  },

  nth: function(n) {
    if (!_.isNumber(n) || n < 1) { throw("Can't search " + this._name + " by number " + n); }
    if (!_.isNumber(n) || n > this.quantity()) { throw("Can't get item #" + n + " from " + this._name + ". Only has " + this.quantity()); }

    return this.where({ nth: n });
  },

  _clone: function(extension) {
    return _.extend(_.clone(this), extension);
  },

  quantity: function() {
    if (this.singular) {
      return this.where.apply(this, arguments) ? 1 : 0;
    }
    return this.where.apply(this, arguments).all().length;
  },

  one: function() {
    return this.where.apply(this, arguments).all()[0];
  },

  the: function() {
    return this.one.apply(this, arguments);
  },

  some: function() {
    if (this.singular) {
      return this.where.apply(this, arguments)!==undefined;
    }
    return this.where.apply(this, arguments).all().length > 0;
  },

  none: function() {
    if (this.singular) {
      return this.where.apply(this, arguments)===undefined;
    }
    return this.where.apply(this, arguments).all().length == 0;
  },

  each: function(fn) {
    return _.each(this.all(), fn, this.game);
  },

  map: function(fn) {
    return _.map(this.all(), fn, this.game);
  },

  filter: function(fn) {
    return _.filter(this.all(), fn, this.game);
  },

  contains: function(item) {
    return _.contains(this.all(), item);
  },

  sum: function(key) {
    return _.reduce(this.all(), function(memo, item) { return memo + item.get(key); }, 0);
  },

  highest: function(key) {
    if (!_.isString(key)) { throw "highest needs an attribute name to sort by"; }
    if (this.all().length==0) { return undefined; }
    return _.max(this.all(), function(item) { return item.get(key); });
  },

  lowest: function(key) {
    if (!_.isString(key)) { throw "lowest needs an attribute name to sort by"; }
    if (this.all().length==0) { return undefined; }
    return _.min(this.all(), function(item) { return item.get(key); });
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
    if (key=='in') { // item is child, value is item or collection or array of items
      if (_.isArray(value)) {
        return _.any(value, function(v) { return v && v._isItem && v.has(item); });
      }
      if (_.isObject(value)) {
        if (value._isItem) {
          return value.has(item);
        }
        if (value._isCollection) { 
          return _.any(value.all(), function(v) { return v.has(item); });
        }
      }
      throw("not a valid container for 'in'");
    }
    if (key=='with') { // item is parent, value is item or where query
      if (_.isObject(value) && value._isItem) {
        return item.has(value);
      }
      return _.any(this.where.call(this.game.allPieces, value).all(), function(v) { return item.has(v); });
    }
    if (key=='name' && (item===value || (_.isArray(value) && (_.contains(value, item))))) { // can be used with object itself
      return true;
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

var Item = {
  _isItem: true,

  get: function(key) {
    if (this[key]===undefined) { throw(this.name + " has no " + key); }

    return _.isFunction(this[key]) ? this[key].apply(this) : this[key];
  },

  // recursive contains
  has: function(item) {
    return item.parent && (item.parent==this || this.has(item.parent));
  },

  // all siblings, optional fn expects item and returns true if this and item are considered siblings
  others: function(fn) {
    if (!this.parent || !this.parent[inflection.pluralize(this.type)]) {
      throw ("can't get siblings");
    }
    var others = this.parent[inflection.pluralize(this.type)].except(this)
    , space = this;
    if (fn) {
      return others.where(function(other) { return fn.call(other, space); });
    }
    return others;
  },

  jsonpath: function(path) {
    if (!this.parent) {
      return undefined;
    }
    return this.parent.jsonpath('.' + this.type + (this._position!==undefined && this._position()!==undefined ? '[' + this._position() + ']' : '') + (path || ''));
  },

  atJsonpath: function(path) {
    if (path==='') {
      return this;
    }
    var next = path.split('.')[0]
    , remainder = path.split('.').slice(1).join('.')
    , match = next.match(/(\w+)\[(\d+)\]/)
    , child;
    if (match && _.isFunction(this[match[1]]) && !_.isNaN(parseInt(match[2], 10))) {
      child = this[match[1]].call(this[match[1]], 1 + parseInt(match[2], 10));
    } else if (_.isFunction(this[next]) && this[next]._isCollection) {
      child = this[next].call();
    } else if (_.isObject(this[next]) && this[next].atJsonpath) {
      child = this[next];
    }
    if (_.isObject(child) && child.atJsonpath) {
      return child.atJsonpath(remainder);
    }
    return undefined;
  },

  _position: function() {
    if (this.position!==undefined) { return this.position; }
    if (!this.parent || !this._isPiece) { return undefined; }
    return this.parent.allPieces({ type: this.type }).all().indexOf(this);
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
  this.allPieces = new Pieces({ game: this }); // collection of all pieces
  this.allSpaces = new Spaces({ game: this }); // collection of all spaces
  this.players = new Players({ game: this }); // collection of all players
  this.player = new Players({ game: this, singular: true }); // collection of one player
};

_.extend(Game.prototype, CanHavePieces, CanHaveSpaces, Item, {

  start: function() {
    this._question = 0;
    this._started = true;
    this.become('start');
  },

  hasPlayers: function(players) {
    if (this._started) {
      throw('game started');
    }
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

  when: function(phase, fn) {
    if (!_.isString(phase)) { throw ("when phase " + phase + " must be a name"); }
    if (!_.isFunction(fn)) { throw ("when phase " + phase + " must provide a function"); }

    this._phases[phase] = fn;
  },

  become: function(phase) {
    if (_.isFunction(this._phases[phase])) {
      this._phases[phase].apply(this, _.toArray(arguments).slice(1));
    } else {
      throw("can't become " + phase);
    }
  },

  ask: function(player, question, callback) {
    if (!_.isArray(question.options)) {
      return callback.call(this, { answer: [question.options] }); // only one option - skip client ask
    }
    this._question++;
    question.id = this._question;
    this.answerCallback = callback;
    this.client.ask(player, question);
  },

  answer: function(answer) {
    if (answer.id==this._question) {
      this.answerCallback.call(this, answer);
    }
  },

  dom: function(player) {
    return this._started && GameEngine.GameXML.get(this, player);
  },

  jsonpath: function(path) {
    return '$' + (path||'');
  },

  atJsonpath: function(path) {
    if (path.substr(0,2)!='$.') { throw('invalid path'); }
    if (path.substr(0,2)!='$.') { throw('invalid path'); }

    return Item.atJsonpath.call(this, path.substr(2));
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
  }
});

Game._validateName = function(word) {
  if (!word.match(/^[a-zA-Z][a-zA-Z0-9_\-]*$/)) {
    throw(word + ' can only contain letters or numbers, underscores or dashes and must start with a letter');
  }
  if (_.contains('game', 'name', 'allPieces', 'allSpaces', 'player', 'players')) {
    throw(word + ' is a reserved word');
  }
};

var Players = function(options) {
  this.game = options.game;
  this._filters = {};
  this.singular = options.singular;
  this._unscoped = this.game._players;
  this._name = "players";
  this._spaces = []; // list of space types owned, tuples of space/pieces
  this._pieces = []; // list of piece types owned

  return this._bindWhere();
};

_.extend(Players.prototype, Collection, {
  haveSpaces: function(name, number, holds) {
    if (this.game._started) {
      throw('game started');
    }
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpaces.apply(player, args);
    });
    this._spaces.push([name, holds]);
    return this._assignSpaces();
  },

  haveSpace: function(name, holds) {
    if (this.game._started) {
      throw('game started');
    }
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpace.apply(player, args);
    });
    this._spaces.push([name, holds]);
    return this._assignSpaces();
  },

  havePieces: function(type) {
    if (this.game._started) {
      throw('game started');
    }
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPieces.apply(player, args);
    });
    this._pieces.push(type);
    return this._assignPieces();
  },

  havePiece: function(type) {
    if (this.game._started) {
      throw('game started');
    }
    var args = arguments;
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPiece.apply(player, args);
    });
    this._pieces.push(type);
    return this._assignPieces();
  },

  cannotSee: function(fn) {
    this.cannotSeeItems = fn;
  },

  must: function(move, fn) {
    var args = arguments
    , game = this.game;
    
    var nextMove = function(players, moveIndex) {
      players[moveIndex].must.call(players[moveIndex], move, function() {
        moveIndex++;
        if (moveIndex < players.length) {
          nextMove(players, moveIndex);
        } else {
          fn.call(game);
        }
      });
    };
    nextMove(this.all(), 0);
  },

  may: function() {
    // TODO
  },

  _assignSpaces: function() {
    _.each(this._spaces, function(spaceHold) {
      this[inflection.pluralize(spaceHold[0])] = new Spaces({
        game: this.game,
        type: inflection.singularize(spaceHold[0]),
        in: this.all()
      })._holds(spaceHold[1]);
    }, this);
    return this;
  },

  _assignPieces: function() {
    _.each(this._pieces, function(piece) {
      this[inflection.pluralize(piece)] = new Pieces({
        game: this.game,
        type: inflection.singularize(piece),
        owner: this.all()
      });
    }, this);
    return this;
  },

  _clone: function(extension) {
    // rebuild holds relationships
    return Collection._clone.apply(this, arguments)._assignSpaces()._assignPieces();
  }
});

var Pieces = function(options) {
  this.game = options.game;
  this._filters = {};
  this.singular = options.singular;
  this._unscoped = this.game._pieces;
  if (options.in) { this._filters.in = options.in; }
  if (options.type) { this._filters.type = options.type; }
  if (options.owner) { this._filters.owner = options.owner; }
  this._name = (options.singular ? 'single ' : 'set of ') + (options.type || 'piece') + (options.owner ? ' of ' + options.owner.name : '') + (options.in ? ' in ' + options.in.name : '');
  return this._bindWhere();
};

_.extend(Pieces.prototype, Collection, {
  moveTo: function(space) {
    var pieces = this.all();
    if (!pieces || (_.isArray(pieces) && pieces.length==0)) {
      return false;
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
  this._filters = {};
  this.singular = options.singular;
  this.player = options.player;
  this._unscoped = this.game._spaces;
  if (options.in) { this._filters.in = options.in; }
  if (options.type) { this._filters.name = options.type; }
  if (options.owner) { this._filters.owner = options.owner; }
  this._name = (options.singular ? 'single ' : 'set of ') + (options.type || 'space') + ' in ' + (options.owner ? options.owner.name : 'game');
  return this._bindWhere();
};

_.extend(Spaces.prototype, Collection, {
  _holds: function(pieces, plural) {
    this._held = pieces;
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
          in: this.all(),
          type: type,
          singular: piece==type && this.singular
        });
      }, this);
    }
    return this;
  },

  _clone: function(extension) {
    // rebuild holds relationships
    return Collection._clone.apply(this, arguments)._holds(this._held);
  },
});

var Player = function(options) {
  this.game = this.parent = options.game;
  this.name = options.name;
  this.type = 'player';
  this.position = options.position;
  this.allPieces = new Pieces({ game: this.game, in: this });
  this.allSpaces = new Spaces({ game: this.game, in: this });
};

_.extend(Player.prototype, CanHaveSpaces, CanHavePieces, Item, {
  win: function() { },

  _canSee: function(piece) {
    if (!this.game.players.cannotSeeItems) {
      return true;
    }
    return _.every(this.game.players.cannotSeeItems.call(this.game, this), function(items) {
      if (items==piece) { return false; }
      if (_.isArray(items) && _.contains(items, piece)) { return false; }
      if (_.isObject(items) && items.where && items.some(piece)) { return false; }
      return true;
    });
  },

  after: function(n) {
    return this.game._players[(this.position+(n===undefined ? 1 : n)) % this.game._players.length];
  },

  opponent: function(n) {
    return this.opponents().first();
  },

  opponents: function(n) {
    return this.game.players.except(this);
  },

  must: function(name, fn) {
    this.isCurrent();
    var move = this.game._moves[name];
    if (!move) { throw('no such move ' + name); }
    if (!_.isFunction(fn)) { throw('must have function after move ' + name); }
    this.currentMove = _.clone(move);
    this.currentMove.prompt(this, function(move) {
      fn.call(move.game, move);
    });
  },

  may: function() {
    // TODO
  },

  isCurrent: function() {
    this.game._currentPlayer = this;
  }
});

var Piece = function(options) {
  this.game = options.game;
  this.type = options.type;
  this.name = options.name;
  this.owner = options.owner;
  if (this.owner && this.owner.type) {
    this[this.owner.type] = this.owner;
  }
  this.attributes = options.attributes;
};

_.extend(Piece.prototype, Item, {
  _isPiece: true,

  moveTo: function(space) {
    var pieceType = this.game._pieceType(this.type);
    if (!pieceType) {
      throw("no such piece '" + this.type + "'");
    }
    if (!space || !_.isObject(space) || !space._isItem) {
      throw("no such space");
    }
    if (!space[pieceType[0]] && !space[pieceType[1]]) {
      throw("'" + space.name + "' does not hold '" + this.type + "'");
    }
    if (!space[pieceType[1]] && space[pieceType[0]].quantity()==1 && space[pieceType[0]].where()!=this) {
      throw(space.name + " can only hold one '" + this.type + "'");
    }
    var from = this.jsonpath();
    if (this.parent) {
      this[this.parent.type] = undefined;
    }
    this.parent = this[space.type] = space;
    if (this.game.client && this.game._currentPlayer) {
      this.game.client.move(from, space.jsonpath(), GameEngine.GameXML.pieceDom(this, this.game._currentPlayer));
    }
  }
});

var Space = function(options) {
  this.game = options.game;
  this.name = this.type = options.name;
  this.owner = options.owner;
  if (this.owner && this.owner.type) {
    this[this.owner.type] = this.owner;
  }
  this.parent = options.owner;
  this.position = options.position;
  this.attributes = options.attributes;
  this.allPieces = new Pieces({ game: this.game, in: this });
  // delegate all collection methods to pieces
  _.chain(Collection).functions().each(function(key) {
    this[key] = this.allPieces[key].bind(this.allPieces);
  }, this);
  this.where = this.allPieces.where; // do not bind this, let _bindWhere bind this one
};

_.extend(Space.prototype, Item, {
  _isSpace: true
,
  _holds: function(pieces) {
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
    }
    return this;
  }
});

var Move = function(options) {
  this.options = options;
  this.pieceChoices = options.pieces || options.piece;
  this.spaceChoices = options.to;
  this.minimum = options.minimum;
  this.maximum = options.maximum;
  if (this.minimum===undefined && this.maximum===undefined) {
    this.minimum = this.maximum = options.exactly || 1;
  }
  this.valid = options.valid;
  this.game = options.game;
  this.name = options.name;
};

_.extend(Move.prototype, {

  to: function() {
    if (_.isFunction(this.options.to)) {
        return this.options.to.call(this.game, this);
    }
    return this.options.to;
  },

  description: function() {
    if (_.isFunction(this.options.description)) {
        return this.options.description.call(this.game, this);
    }
    return this.options.description;
  },

  prompt: function(player, callback) {
    var move = this;

    this.player = player;
    var pieces = this._arrayOrSingle(this.pieceChoices.call(this.game, this), 'jsonpath');
    if ((pieces.length || (pieces!==undefined ? 1 : 0)) < this.minimum) {
      throw("not enough valid pieces to move for " + this.name);
    }

    question = {
      type: 'select',
      multiple: this.maximum!=1,
      description: this.description(),
      options: pieces
    };

    this.game.ask(player, question, function(answer) {
      var piece = answer.answer;
      if (!piece) {
        return false;
      }
      move.pieces = [];
      _.each(piece, function(path) {
        if (!_.contains(question.options, path)) {
          throw('not an option: ' + path);
        }
        move.pieces.push(move.game.atJsonpath(path));
      });
      move.pieces = _.unique(move.pieces);
      if (move.maximum==1) {
        move.piece = move.pieces[0];
        move.from = move.piece.parent;
      }
      if (!move.pieces) {
        throw(piece + " is not an option");
      }
      if (move.minimum!==undefined && move.pieces.length < move.minimum) {
        throw(piece + " is not enough");
      }
      if (move.maximum!==undefined && move.pieces.length > move.maximum) {
        throw(piece + " is too many");
      }
      move.to = move._arrayOrSingle(move.spaceChoices.call(move.game, move), 'jsonpath');
      question = {
        type: 'select',
        description: move.description(),
        options: move.to,
        continuation: true
      };
      move.game.ask(player, question, function(answer) {
        move.to = move.game.atJsonpath(answer.answer[0]);
        if (move.valid && !move.valid.call(move.game, move)) {
          throw(piece + " is not a valid option");
        }
        _.each(move.pieces, function(piece) {
          piece.moveTo(move.to);
        });
        callback.call(move.game, move);
      });
    });
  },

  _arrayOrSingle: function(objects, property) {
    if (objects._isCollection) {
      if (objects.singular) {
        var item = objects.first();
        return item ? item[property] : undefined;
      }
      return objects.list(property);
    }
    if (_.isArray(objects)) {
      return _.invoke(objects, property);
    }
    if (objects._isItem) {
      return objects.get(property);
    }
    return objects[property]; // ?
  }
});

var Choice = function(options) {
  this.options = options;
  this.choices = options.choices;
  this.minimum = options.minimum;
  this.maximum = options.maximum;
  if (this.minimum===undefined && this.maximum===undefined) {
    this.minimum = this.maximum = options.exactly || 1;
  }
  this.valid = options.valid;
  this.game = options.game;
  this.name = options.name;
};

_.extend(Choice.prototype, {
  description: function() {
    if (_.isFunction(this.options.description)) {
        return this.options.description.call(this.game, this);
    }
    return this.options.description;
  },

  prompt: function(player, callback) {
    question = {
      type: 'select',
      description: options.description,
      multiple: options.multiple,
      options: choices
    };
    return function() {    
      callback.call(move.game, move);
    };
  }
});


var GameXML = GameEngine.GameXML = {
  get: function(game, viewer) {
    var board = $('<board>');
    game.players.each(function(player) {
      GameXML.addNode($('<player>', {
        class: 'player',
        name: player.name,
        jsonpath: player.jsonpath()
      }).attr('position', player.position+1).appendTo(board), player, game, viewer);
    });
    return GameXML.addNode(board, game, game, viewer);
  },

  addNode: function(node, parent, game, viewer) {
    _.each(_.where(game._spaces, { parent: parent }), function(space) {
      if (!viewer || viewer._canSee(space)) {
        GameXML.addNode(GameXML.spaceDom(space).appendTo(node), space, game, viewer);
      }
    }, GameXML);
    _.each(_.where(game._pieces, { parent: parent }), function(piece) {
      GameXML.addNode(GameXML.pieceDom(piece, viewer).appendTo(node), piece, game, viewer);
    }, GameXML);
    return node;
  },

  spaceDom: function(space) {
    var $el = $('<' + space.name + '>', { class: 'space', jsonpath: space.jsonpath() });
    _.each(space.attributes, function(attr) {
      var val = space.get(attr);
      if (!_.isObject(val)) {
        $el.attr(attr, val);
      }
    });
    if (space.player) { $el.attr('player', space.player.position + 1); }
    return $el;
  },

  pieceDom: function(piece, viewer) {
    var $el = $('<' + piece.type + '>', { class: 'piece', jsonpath: piece.jsonpath() });
    if (!viewer || viewer._canSee(piece)) {
      $el.attr('name', piece.name);
      _.each(piece.attributes, function(attr) {
        var val = piece.get(attr);
        if (!_.isObject(val)) {
          $el.attr(attr, val);
        }
      });
    }
    if (piece.player) { $el.attr('player', piece.player.position + 1); }
    return $el;
  }
};
