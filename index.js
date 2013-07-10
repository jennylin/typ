var Game = exports.Game = function() {
  this.state = null;
  this.states = {};
  this.commands = [];
}

Game.prototype.on = function(name, cb) {
  this.states[name] = cb;
}

Game.prototype.start = function() {

}
