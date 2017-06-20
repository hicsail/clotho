$('#reset').on('submit', function (e) {
    e.preventDefault();

    const email = $('#email')[0].value;

    $.post('/api/login/forgot', {email:email}, function (data) {
        successAlert('Success! You will receive an email to reset your password soon!', unlimited=true);
    }).fail(function (data) {
        failureAlert('Please enter your email');
    });

});
