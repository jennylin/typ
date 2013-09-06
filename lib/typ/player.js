var Player = module.exports = function(game, userId, position, name) {
  this.game = game;
  this.userId = userId;
  this.position = position;
  this.name = name;
  this.hand = [];
};

Player.prototype.receiveCards = function(cards) {
  this.hand = this.hand.concat(cards);
  console.log("player "+this.position+" has "+JSON.stringify(this.hand));
}
