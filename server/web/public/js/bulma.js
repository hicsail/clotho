jQuery(document).ready(function ($) {

  var navButton = $('.nav-toggle');
  var navMenu = $('.nav-menu');

  navButton.click(() => {
      navButton.toggleClass('is-active');
      navMenu.toggleClass('is-active');
  });
});
