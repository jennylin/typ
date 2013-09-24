var typ = require('../typ/game');
module.exports = function() {
  var nim = new typ.Game("nim");
  nim.setPlayerCount(2);

  nim.state('init', function() {
    this.heap = Math.floor(Math.random()*10 + 5);
    this.transition('turns');
  });

  this.state('turns', function() {
    game.players.indefinitely(function(player, next) {
      game.ask(player).pick().from([1,2,3]).then(function(number) {
        this.heaps -= number;
        if (this.heaps <= 0) {
          this.win(player);
        }
      });
    });
  });
};
