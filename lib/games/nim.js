var typ = require('../typ/game');
module.exports = function() {
  var game = new typ.Game("nim");
  game.setPlayerCount(2);

  game.state('init', function() {
    game.heap = Math.floor(Math.random()*10 + 5);
    game.transition('play');
  });

  game.state('play', function() {
    var player = game.players[game.count('play') % 2];
    game.ask(player).pick().from([1,2,3]).then(function(number) {
      game.heaps -= number;
      if (game.heaps <= 0) {
        game.transition('win', player);
      } else {
        game.transition('play');
      }
    });
  });

  game.state('win', function(winner) {
    game.win(winner);
    game.end();
  });
};
