var _ = require('underscore');

var Game = module.exports.Game = function() {
  this._pieces = []; // array of all Piece's
  this._spaces = []; // array of all Space's
  this.pieces = new Pieces({
    game: this,
    items: this._pieces
  }); // collection of all pieces
  this.spaces = new Spaces(); // collection of all spaces
};

_.extend(Game.prototype, {
  /**
   * Create pieces instances and create reference to collection with plural name
   */
  hasPieces: function(singular, plural, names, methods) { // names e.g.: ['2C',...], { wheat: 3,... }
    var game = this
    , pieces = [];

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
      items: pieces,
      type: singular
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
    var piece = _.extend(new Piece(type, name), methods);
    this._pieces.push(piece);
    return piece;
  },

  hasSpace: function(name, methods) {
    this.spaces[name] = this[name] = new Space();
    return this;
  }
});

var Collection = module.exports.Collection = function() {
  this._items = []; // array of objects to choose from
  this.singular = false; // this collection expected to hold a single item at most so always returns a single result
  this.filters = {}; // filters that will narrow results
  this.rejects = {}; // exclusions that will narrow results
  return this._bindWhere();
};

_.extend(Collection.prototype, {
  where: function(name, query, reject) {
    if (typeof name === "string") {
      query = _.extend(query || {}, { name: name });
    } else {
      query = name;
    }
    if (query===undefined) {
      return this;
    }
    _.extend(query, this[reject ? 'rejects' : 'filters']);
    filtered = _.clone(this);
    filtered[reject ? 'rejects' : 'filters'] = query;
    return filtered;
  },

  except: function(name, query) {
    return this.where(name, query, true);
  },

  items: function() {
    var collection = this;
    return _.filter(this._items, function(item, index, items) {
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
      return item._get(key);
    }, this);
  },

  size: function() {
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

  highest: function(key) {
    return _.max(this.items(), function(item) { return item._get(key); });
  },

  lowest: function(key) {
    return _.min(this.items(), function(item) { return item._get(key); });
  },

  _test: function(item, index, items, key, value) {
    if (key=='first') { return index < value; }
    if (key=='last') { return index >= items.length - value; }
    return item._get(key) == value;
  },

  _bindWhere: function() {
    return _.extend(this.where.bind(this), this);
  }
});

var Pieces = module.exports.Pieces = function(options) {
  this.game = options.game;
  this.filters = options.type ? { type: options.type } : {};
  this._items = options.items;
  return this._bindWhere();
};

_.extend(Pieces.prototype, Collection.prototype);

var Spaces = module.exports.Space = function() {
  return this._bindWhere();
};

_.extend(Spaces.prototype, Collection.prototype);

var Item = function() {
};

Item.prototype._get = function(key) {
  return typeof this[key]=='function' ? this[key].apply(this) : this[key];
};

var Piece = module.exports.Piece = function(type, name, player) {
  this.type = type;
  this.name = name;
  this.player = player;
};

_.extend(Piece.prototype, Item.prototype);
