$(function () {
  if (window.location.hash.substr(1)) {
    $('#key').val(window.location.hash.substr(1));
  }
});

$('#reset').on('submit', function (e) {
  e.preventDefault();

  const key = $('#key')[0].value;
  const email = $('#email')[0].value;
  const password = $('#password')[0].value;
  const passwordConfirm = $('#retypePw')[0].value;

  if (password != passwordConfirm) {
    failureAlert('Password do not match');
  } else {
    $.post('/api/login/reset', {key: key, email: email, password: password}, function (data) {
      successAlert('Success! Password has been updated', unlimited = true);
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

// Password verification
$('#retypePw').keyup(function (e) {
  e.preventDefault();
  var pw = $('#password')[0].value;
  var pw2 = $('#retypePw')[0].value;
  if (pw === '') {
    $('#retypePwStatus').text('Please type in a password');
  } else if (pw === pw2) {
    $('#retypePw').removeClass('is-danger').addClass('is-success');
    $('#retypePwRightIcon').removeClass('fa-warning').addClass('fa-check');
    $('#retypePwCheck').css('display', '');
    $('#retypePwStatus').text('Passwords match!');
  } else {
    $('#retypePw').removeClass('is-success').addClass('is-danger');
    $('#retypePwRightIcon').removeClass('fa-check').addClass('fa-warning');
    $('#retypePwCheck').css('display', '');
    $('#retypePwStatus').text('Passwords do not match');
  }
});

$('#password').keyup(function (e) {
  var password = vaildPassword($('#password').val());
  if(password !== true) {
    $('#password').removeClass('is-success').addClass('is-danger');
    $('#passwordRightIcon').removeClass('fa-check').addClass('fa-warning');
    $('#passwordCheck').css('display', '');
  } else {
    $('#password').removeClass('is-danger').addClass('is-success');
    $('#passwordRightIcon').removeClass('fa-warning').addClass('fa-check');
    $('#passwordCheck').css('display', '');
  }
});

function vaildPassword(password) {
  if (!(password.length >= 8)) {
    return "Password must be 8 characters long";
  }

  if (!(password.length <= 32)) {
    return "Password can not exceed 32 characters in length";
  }

  if (!((password.match(/[a-z]/g) || []).length >= 1)) {
    return "Password must contain at least 1 lowercase letter";
  }

  if (!((password.match(/[A-Z]/g) || []).length >= 1)) {
    return "Password must contain at least 1 uppercase letter";
  }

  if (!((password.match(/[0-9]/g) || []).length >= 1)) {
    return "Password must contain at least 1 number";
  }

  return true;
}
