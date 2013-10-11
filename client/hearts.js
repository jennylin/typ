$(function() {
  client = new GameClient(hearts, $('#board'), $('#questions'));
  client.transform = function(html) {
    html.find('card').each(function() {
      if ($(this).attr('name')) {
        $(this).html($(this).attr('name')[0]);
      } else {
        $(this).addClass('facedown');
      }
    });
    html.find('tricks_area').each(function() {
      $(this).html($(this).attr('count')=='0' ? '' : $(this).attr('count'));
    });
    return html;
  };
  client.game.start();
});
