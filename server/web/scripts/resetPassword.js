$(function() {
  if(window.location.hash.substr(1)){
    $('#key').val(window.location.hash.substr(1));
  }
});

$('#reset').on('submit', function (e) {
    e.preventDefault();

    const key = $('#key')[0].value;
    const email = $('#email')[0].value;
    const password = $('#password')[0].value;
    const passwordConfirm = $('#passwordConfirm')[0].value;

    if(password != passwordConfirm){
      failureAlert('Password do not match');
    } else {
      $.post('/api/login/reset', {key:key, email:email, password:password}, function (data) {
          successAlert('Success! Password has been updated', unlimited=true);
      }).fail(function (data) {
          console.log(data.responseJSON.message);
          switch (data.responseJSON.message) {
            case 'child "email" fails because ["email" is not allowed to be empty]':
              failureAlert('Please Enter Email');
              break;
            case 'child "key" fails because ["key" is not allowed to be empty]':
              failureAlert('Please Enter Key');
              break;
            case 'child "password" fails because ["password" is not allowed to be empty]':
              failureAlert('Please Enter Password');
              break;
            default:
              failureAlert(data.responseJSON.message);
              break;
          }
      });
    }
});
