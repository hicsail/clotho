$('#reset').on('submit', function (e) {
    e.preventDefault();

    const email = $('#email')[0].value;

    $.post('/api/login/forgot', {email:email}, function (data) {
        successAlert('Success! You will receive an email to reset your password soon!', unlimited=true);
    }).fail(function (data) {
        failureAlert('Please enter your email');
    });

});

function failureAlert(message) {
    $('#alert').text(message).removeClass('is-success').addClass('is-danger').css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, 400);
}

function successAlert(message, unlimited) {
    $('#alert').text(message).removeClass('is-danger').addClass('is-success').css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, 400);
    if (unlimited === false) {
        window.setTimeout(function () {
            $('#alert').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 400);
        }, 2500);
    }
}
