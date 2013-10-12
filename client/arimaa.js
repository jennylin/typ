$(function() {
  client = new GameClient(arimaa, $('#board'), $('#questions'));
  client.display = {
    piece: function($) {
      return '♟♞♝♜♛♚♙♘♗♖♕♔'[parseInt($.attr('strength'), 10) + ($.attr('player')==1 ? 5 : -1)];
    }
  };

  client.game.start();
});
