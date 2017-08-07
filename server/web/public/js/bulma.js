$().ready(function ($) {

  var navButton = $('.nav-toggle');
  var navMenu = $('.nav-menu');

  navButton.click(() => {

    navButton.toggleClass('is-active');
    navMenu.toggleClass('is-active');
  });

  $('.nav-item').each((index, ele) => {

    var element = ele;

    if (window.location.pathname == $(element).attr('href')) {
      $(element).addClass('is-active');
    }
  });
});
