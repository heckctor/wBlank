jQuery(document).ready(function($){
  $('.hp-search input').attr('placeholder','Buscar...');
  $('.menu-mobile').click(function(){
    $('.menu').toggleClass('is-menu-active');
    $('.hamburger').toggleClass('hamburger--squeeze is-active');
  });

  var topAreaHeight = $('#top-area').height() - 3;
  console.log('Top Area alto: ' + topAreaHeight);
  $('body').attr('style', 'padding-top:' + topAreaHeight + 'px');


  $('.element-invisible').remove();


  var URLdomain = window.location.host;
  console.log(URLdomain);
  $('.hp-search input[type="image"]').attr('src','http://dev.hektor.com.mx/enehrl/templates/enehrl/assets/images/search.png');

  $('.hp-search input[type="image"]').attr('alt','');
});
