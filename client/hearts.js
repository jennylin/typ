$(function() {
  client = new GameClient(hearts, $('#board'), $('#questions'));
  client.display = {
    card: function($) {
      return  $.attr('name') ? $.attr('name')[0] : '';
    }
  };
  client.game.start();
});
