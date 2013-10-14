$(function() {
  client = new GameClient(catan, $('#board'), $('#questions'));
  client.display = {
    space: function($) {
      return  $.attr('resource') + ($.attr('roll') ? '<br>' + $.attr('roll') : '');
    },
    city: function($) {
      return '□';
    },
    settlement: function($) {
      return '⌂';
    },
    robber: function($) {
      return 'R';
    },
    road: function($) {
      return '|';
    }
  };

  client.game.start();
});
