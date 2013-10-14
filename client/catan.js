$(function() {
  client = new GameClient(catan, $('#board'), $('#questions'));
  client.display = {
    space: function($) {
      return  $.attr('resource') + ($.attr('roll') ? ' ' + $.attr('roll') : '');
    }
  };

  client.game.start();
});
