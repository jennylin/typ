/**
TODO:

short circuit the move.to if no choice?

must(qs) -> new Move's -> ask(moves.map:question, { move[selected].answer; deref others })

move.init(player, callback)
move.selection - single initial piece selection to indicate which move to take among several possible
move.question - currently open choice - always returns a question object even if no meaningful choice
move.answer(answer) - answer the question and run the move

ask ( player, q, callback )

question:
  name
  segment 'piece' or 'space'
  type 'select' or 'text'
  multiple bool
  minimum req
  maximum req
  description
  choices array


 need to privatize move methods

 need to move dom manip and pass objects
 prompt for strings or discarded pieces need to display

 better empty/occupied check
 recursion: spaces->spaces, pieces->pieces ?
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

var root = this, GameEngine, Game, Space, Spaces, Piece, Pieces, Player, Players, Move, CompoundMove, GameXML;

if (typeof exports !== 'undefined') {
  GameEngine = exports;
  var _ = require('underscore')
  , $ = require('jquery')
  , inflection = require('inflection');
} else {
  GameEngine = root.GameEngine = {};
  _ = root._;
}

var CanHaveSpaces = {
  /**
   * create space root node and instance/collection reference as name. Optional holds sets restriction and singular/plural on the piece
   * collection and creates reference to piece collection on this space
   */
  hasSpace: function(options) {
    if (!options.name) { throw('hasSpace requires a space name'); }
    this[inflection.singularize(options.name)] = this._createSpace(options.name, options.holds, options.attributes, options.methods);
    return this;
  },

  hasSpaces: function(options) {
    if (!options.name) { throw('hasSpaces requires a space name'); }
    if (!_.isNumber(options.number) || options.number < 1) { throw('hasSpaces requires a number of spaces'); }

    _(options.number).times(function(position) {
      this._createSpace(options.name, options.holds, options.attributes, options.methods, position);
    }, this);

    this[inflection.pluralize(options.name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(options.name),
      owner: this
    })._holds(options.holds);
    this[inflection.singularize(options.name)] = new Spaces({
      game: this.game,
      type: inflection.singularize(options.name),
      singular: true,
      owner: this
    })._holds(options.holds);

    return this;
  },

  _createSpace: function(name, holds, attributes, methods, position) {
    Game._validateName(inflection.singularize(name));
    Game._validateName(inflection.pluralize(name));
    var space = _.extend(
      new Space({
        game: this.game,
        name: inflection.singularize(name),
        position: position,
        owner: this,
        attributes: attributes ? _.keys(attributes) : undefined
      }), attributes, methods
    )._holds(holds);
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
          singular: true
        })._holds(holds);
      }
    }

    return space;
  },
};

var CanHavePieces = {
  /**
   * Create pieces instances and create reference to collection with plural name
   */
  hasPieces: function(options) { // names e.g.: ['2C',...], { wheat: 3,... }
    if (!options.type) { throw('hasPieces requires a piece type'); }
    if (!_.isNumber(options.number) && !_.isArray(options.names)
        && (!_.isObject(options.names) || !_.every(options.names, function(n) { return _.isNumber(n); }))) {
      throw('hasPieces requires a number of pieces or list of piece names');
    }

    this.game._pieceNames.push([inflection.singularize(options.type), inflection.pluralize(options.type)]);

    if (_.isNumber(options.number)) {
      var tmp = {};
      tmp[inflection.singularize(options.type)] = options.number;
      options.names = tmp;
    }

    _.each(options.names, function(value, key) {
      if (_.isNumber(value)) {
        _(value).times(function() {
          this._createPiece(options.type, key, options.attributes, options.methods);
        }, this);
      } else {
        this._createPiece(options.type, value, options.attributes, options.methods);
      }
    }, this);

    this[inflection.pluralize(options.type)] = new Pieces({
      game: this.game,
      type: inflection.singularize(options.type),
      owner: this
    });
    if (inflection.pluralize(options.type)!=inflection.singularize(options.type)) {
      this[inflection.singularize(options.type)] = new Pieces({
        game: this.game,
        type: inflection.singularize(options.type),
        singular: true,
        owner: this
      });
    }
    return this;
  },

  /**
   * Create piece instance and create reference to instance with name
   */
  hasPiece: function(options) {
    if (!options.name) { throw('hasPiece requires a piece name'); }

    this.game._pieceNames.push([inflection.singularize(options.name), inflection.pluralize(options.name)]);
    this[inflection.singularize(options.name)] = this._createPiece(options.name, inflection.singularize(options.name), options.attributes, options.methods);
    return this;
  },

  _createPiece: function(type, name, attributes, methods) {
    type = inflection.singularize(type);
    Game._validateName(type);

    var piece = _.extend(new Piece({
      game: this.game,
      type: type,
      name: name,
      owner: this,
      attributes: attributes ? _.keys(attributes) : undefined
    }), attributes, methods);
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

    var filtered;
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

  played: function() {
    return this.where({ in: this.game });
  },

  unplayed: function() {
    return this.where({ parent: null });
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

  backwards: function() {
    var clone = this._clone();
    clone._unscoped = _.clone(clone._unscoped).reverse();
    return clone;
  },

  from: function(index) {
    index = _.isNumber(index) ? index : this._unscoped.indexOf(index);
    if (index && index > 0) {
      var clone = this._clone();
      clone._unscoped = this._unscoped.slice(index).concat(this._unscoped.slice(0,index));
      return clone;
    }
    return this;
  },

  _testIndex: function(index, length, key, value) {
    if (key=='nth') { return index==value-1; }
    if (key=='first') { return index < value; }
    if (key=='last') { return index >= length - value; }
  },

  _test: function(item, key, value) {
    if (value===undefined) { return true; }
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
  },

  _serialize: function() {
    return _.invoke(this.all(), '_serialize');
  }
};

var Item = {
  _isItem: true,
  parent: null,

  get: function(key) {
    if (this[key]===undefined) { throw(this.name + " has no " + key); }

    return _.isFunction(this[key]) ? this[key].apply(this) : this[key];
  },

  // recursive contains
  has: function(item) {
    return item && (item.parent==this || this.has(item.parent));
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
      return '$.' + (this._isSpace ? '_spaces' : '_pieces') + '[' + (this._isSpace ? this.game._spaces : this.game._pieces).indexOf(this) + ']';
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
  },

  _serialize: function(player) {
    var obj = {
      type: this.type,
      jsonpath: this.jsonpath()
    };
    if (!player || !player._canSee(this)) {
      obj.name = this.name;
      if (this.player) {
        obj.player = this.player.position + 1;
      }
      _.each(this.attributes, function(attr) {
        var val = this.get(attr);
        if (!_.isObject(val)) {
          obj[attr] = val;
        }
      }, this);
    }
    return obj;
  }
};

var Game = function(name) {
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
      if (move.moves) {
        this._moves[name] = new CompoundMove(_.extend(move, { name: name, game: this.game }));
      } else {
        this._moves[name] = new Move(_.extend(move, { name: name, game: this.game }));
      }
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
    this._question++;
    question.id = this._question;
    this.answerCallback = callback;
    this.client.ask(player, question);
  },

  answer: function(answer) {
    if (answer.id==this._question) {
      this.answerCallback(answer.answer);
    }
  },

  dom: function(player) {
    return this._started && GameXML.get(this, player);
  },

  jsonpath: function(path) {
    return '$' + (path||'');
  },

  atJsonpath: function(path) {
    if (path.substr(0,2)!='$.') { throw('invalid path'); }
    var match = path.match(/\$\.(_pieces|_spaces)\[(\d+)\]/);
    if (match) {
      return this[match[1]][match[2]];
    }
    return Item.atJsonpath.call(this, path.substr(2));
  },

  _deserialize: function(obj) {
    return this.atJsonpath(obj.jsonpath);
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
  haveSpaces: function(options) {
    if (this.game._started) {
      throw('game started');
    }
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpaces.call(player, options);
    });
    this._spaces.push([options.name, options.holds]);
    return this._assignSpaces();
  },

  haveSpace: function(options) {
    if (this.game._started) {
      throw('game started');
    }
    _.each(this.game._players, function(player) {
      CanHaveSpaces.hasSpace.call(player, options);
    });
    this._spaces.push([options.name, options.holds]);
    return this._assignSpaces();
  },

  havePieces: function(options) {
    if (this.game._started) {
      throw('game started');
    }
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPieces.call(player, options);
    });
    this._pieces.push(options.type);
    return this._assignPieces();
  },

  havePiece: function(options) {
    if (this.game._started) {
      throw('game started');
    }
    _.each(this.game._players, function(player) {
      CanHavePieces.hasPiece.call(player, options);
    });
    this._pieces.push(options.type);
    return this._assignPieces();
  },

  cannotSee: function(fn) {
    this.cannotSeeItems = fn;
  },

  must: function(move, fn) {
    var args = arguments
    , game = this.game;
    
    var nextMove = function(players, moveIndex) {
      var continuation = function() {
        moveIndex++;
        if (moveIndex < players.length) {
          nextMove(players, moveIndex);
        } else {
          fn.call(game);
        }
      };
      if (_.isFunction(move)) {
        move.call(game, players[moveIndex], continuation);
      } else {
        players[moveIndex].must.call(players[moveIndex], move, continuation);
      }
    };
    nextMove(this.all(), 0);
  },

  may: function() {
    // TODO
  },

  announce: function(msg) {
    this.game.client.announce(msg);
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

  opponent: function() {
    return this.opponents().first();
  },

  opponents: function() {
    return this.game.players.except(this);
  },

  must: function(moves, fn) {
    this.isCurrent();
    if (!_.isFunction(fn)) { throw('must have function after move ' + moves); }
    
    var multimove = true;
    if (!_.isArray(moves)) {
      multimove = false;
      moves = [moves];
    }

    var candidateMoves = [];

    _.each(moves, function(name) {
      var move = this.game._moves[name];
      if (!move) { throw('no such move ' + name); }
      move = move.init(this, fn);
      if (move.possible()) {
        candidateMoves.push(move);
      }
    }, this);

    if (candidateMoves.length==0) {
      throw('no moves possible');
    }

    if (!multimove) {
      candidateMoves[0].prompt();
    } else {
      var moveMapping = {};
      _.each(candidateMoves, function(move) {
        var selection = move._serialize(move.selection());
        if (selection) {
          if (moveMapping[selection]) {
            throw (move.name + ' conflicts with ' + moveMapping[selection].name);
          }
          moveMapping[selection] = move;
        }
      });
      var question = {
        segment: 'piece',
        type: 'select',
        choices: _.values(moveMapping)
      };
      this.game.ask(this, question, function(answer) {
        var selectedMove = moveMapping[answer];
        if (!selectedMove) {
          throw('invalid choice');
        }
        selectedMove.answer(question, answer);
      });
    }
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
      this.game.client.move(from, space.jsonpath(), GameXML.pieceDom(this, this.game._currentPlayer));
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
    if (!this[key]) {
      this[key] = this.allPieces[key].bind(this.allPieces);
    }
  }, this);
  this.where = this.allPieces.where; // do not bind this, let _bindWhere bind this one
};

_.extend(Space.prototype, Item, {
  _isSpace: true,

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
  },

  _serialize: function(player) {
    if (player && !player._canSee(this)) {
      return null;
    }
    var obj = {
      name: this.name,
      jsonpath: this.jsonpath()
    };
    if (this.player) {
      obj.player = this.player.position + 1;
    }
    _.each(this.attributes, function(attr) {
      var val = this.get(attr);
      if (!_.isObject(val)) {
        obj[attr] = val;
      }
    }, this);
    return obj;
  }
});

var Move = function(options) {
  this.options = options;
  this.options.pieces = options.pieces || options.piece;
  this.minimum = options.minimum;
  this.maximum = options.maximum;
  if (this.minimum===undefined && this.maximum===undefined) {
    this.minimum = this.maximum = options.exactly || 1;
  }
  this.before = options.before;
  this.game = options.game;
  this.name = options.name;
};

_.extend(Move.prototype, {
  init: function(player, callback) {
    var move = _.clone(this);
    move.player = player;
    move._callback = callback;
    return move;
  },

  selection: function() {
    var selection;
    if (_.isFunction(this.options.selection)) {
      selection = this.options.selection.call(this.game, this);
    } else {
      selection = this.pieceChoices();
    }
    if (selection.length!=1) {
      throw(this.name + ' must be selectable with a single piece but have ' + selection.length);
    }
    return this.selection[0];
  },

  pieceChoices: function() {
    if (_.isFunction(this.options.pieces)) {
      return this.options.pieces.call(this.game, this);
    }
    return this.options.pieces;
  },

  toChoices: function() {
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

  question: function() {
    if (!this.pieces) {
      var pieces = this._serialize(this.pieceChoices());
      if (pieces.length < this.minimum) {
        throw("not enough valid pieces to move for " + this.name);
      }

      return {
        name: this.name,
        segment: 'piece',
        type: 'select',
        multiple: this.maximum!=1,
        minimum: this.minimum,
        maximum: this.maximum,
        description: this.description(),
        choices: pieces
      };
    }

    var tos = this._serialize(this.toChoices());
    if (!tos) {
      throw("no valid spaces to move to " + this.name);
    }

    return {
      name: this.name,
      segment: 'to',
      type: 'select',
      description: this.description(),
      minimum: 1,
      maximum: 1,
      choices: tos
    };
  },

  answer: function(question, answer) {
    if (question.type=='select') {
      var selectedItems = [];
      _.each(answer, function(piece) {
        if (!_.contains(question.choices, piece)) {
          throw('not an option: ' + piece);
        }
        selectedItems.push(piece);
      }, this);

      if (question.segment=='piece') {
        this.pieces = _.compact(_.unique(_.map(selectedItems, function(item) {
          return this.game._deserialize(item);
        }, this)));

        if (this.maximum==1) {
          this.piece = this.pieces[0];
          this.from = this.piece.parent;
        }
        if (this.minimum!==undefined && this.pieces.length < this.minimum) {
          throw(answer + " is not enough");
        }
        if (this.maximum!==undefined && this.pieces.length > this.maximum) {
          throw(answer + " is too many");
        }
      } else if (question.segment=='to') {
        this.to = this.game._deserialize(selectedItems[0]);

        if (this.before && this.before.call(this.game, this)===false) {
          throw(answer + " is not a valid option");
        }
      }

      if (this.pieces && this.to) {
        _.each(this.pieces, function(piece) {
          piece.moveTo(this.to);
        }, this);
        this._callback.call(this.game, this);
      } else {
        this.prompt();
      }
    }
  },

  prompt: function() {
    var question = this.question()
    , move = this;
    if (question.choices.length > question.minimum || question.minimum < question.maximum) {
      this.game.ask(this.player, question, function(answer) {
        move.answer(question, answer);
      });
    } else {
      this.answer(question, question.choices);
    }
  },

  possible: function() {
    var pieces = this._serialize(this.pieceChoices());
    return (_.isArray(pieces) ? pieces.length : (pieces ? 1 : 0)) >= this.minimum;
  },

  // array of jsonpath description of items, accepts collection or array or a single item
  _serialize: function(objects) {
    if (_.isArray(objects)) {
      return _.invoke(objects, '_serialize', this.player);
    }
    if (objects._isCollection) {
      if (objects.singular) {
        objects = objects.first();
      }
    }
    if (objects===null || objects===undefined) {
      return null;
    }
    if (!objects._serialize) {
      throw('choices for ' + this.name + ' must be a collection or array of items or a single item');
    }
    var jsons = objects._serialize(this.player);
    return _.isArray(jsons) ? jsons : [jsons];
  }
});

var CompoundMove = function(options) {
  this.options = options;
  this.valid = options.valid;
  this.game = options.game;
  this.name = options.name;
  this.moves = options.moves;
};

_.extend(CompoundMove.prototype, {
  prompt: function(player, callback) {
    // TODO needs to be atomic for failure
    var compoundMove = this;
    if (this.moves.length) {
      var move = this.moves.shift();
      move.prompt(player, function() {
        compoundMove.prompt();
      });
    } else {
      callback.call(this.game, this);
    }
  },

  possible: function(player) {
    return _.all(this.moves, function(move) {
      return move.possible(player);
    });
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
    var question = {
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


var GameXML = {
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
