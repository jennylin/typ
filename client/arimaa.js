$(function() {
  client = new GameClient(arimaa, $('#board'), $('#questions'));

  client.game.start();
});
