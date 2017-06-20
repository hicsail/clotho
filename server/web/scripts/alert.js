function failureAlert(message) {
  $('#alertMessage').text(message);
  $('#alert').removeClass('is-success').addClass('is-danger').css({
    opacity: 0,
    visibility: "visible"
  }).animate({opacity: 1}, 400);
}

function successAlert(message, unlimited) {
    $('#alertMessage').text(message);
    $('#alert').removeClass('is-danger').addClass('is-success').css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, 400);
    if (unlimited === false) {
        window.setTimeout(function () {
            $('#alert').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 400);
        }, 2500);
    }
}

$(function () {
  $('#delete').click(function() {
    $('#alert').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 400);
  });
})
