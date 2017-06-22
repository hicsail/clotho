$('#reset').on('submit', function (e) {
    e.preventDefault();

    const email = $('#email')[0].value;

    $.post('/api/login/forgot', {email:email}, function (data) {
        successAlert('Success! You will receive an email to reset your password soon!', unlimited=true);
    }).fail(function (data) {
        if(data.responseJSON.message == 'child "email" fails because ["email" is not allowed to be empty]'){
          failureAlert("Email is not allowed to be blank");
          return;
        }
        failureAlert(data.responseJSON.message);
    });

});
