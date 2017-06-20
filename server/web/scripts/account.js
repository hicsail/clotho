var nameField = $('#name');
var usernameField = $('#username');
var email = $('#email');
var accountInfoFields = [nameField, usernameField, email];
var passwordField = $('#password');
var retypePasswordField = $('#retypePassword');
var passwordFields = [passwordField, retypePasswordField];
var accountInfoForm = document.getElementById('changeAccountInfoForm');
var passwordForm = document.getElementById('changePasswordForm');
var forms = [accountInfoForm, passwordForm];
hideForms([forms[1]]);

$('#changeAccountInfoForm').on('submit', function (e) {
  e.preventDefault();
  checkAccountInformation(accountInfoFields);
});
$('#changePasswordForm').on('submit', function (e) {
  e.preventDefault();
  checkPassword(passwordFields);
});

$('#changeUserAccountInfo').click(function (e) {
  e.preventDefault();
  hideForms(forms);
  accountInfoForm.style.display = '';
  $('#success').hide();
  $('#pwd').removeClass('is-active');
  $('#actInfo').addClass('is-active');
});
$('#changePassword').click(function (e) {
  e.preventDefault();
  hideForms(forms);
  passwordForm.style.display = '';
  $('#pwNotification').hide();
  $('#actInfo').removeClass('is-active');
  $('#pwd').addClass('is-active');
});

// Make sure the fields are inputted properly for the change account information form and send a put request
function checkAccountInformation(fields) {
  // Remove red outline of boxes
  removeDanger(fields);
  // Loop through fields to see if they are filled.
  var valid = allFieldsFilled(fields);
  if (valid) {
    var values = {};    // Stores the values of the input fields
    $.each($('#changeAccountInfoForm').serializeArray(), function (i, field) {   // Loops through the input fields
      values[field.name] = field.value;
    });
    // If user/email does not already exist, success, refresh page
    // If any error, show it in an alert
    $.ajax({
      url: '/api/users/my',
      method: 'PUT',
      data: values,
      success: function () {
        successAlert('Success!');
      },
      error: function (data) {
        failureAlert(data.responseJSON.message);
      }
    });
  }
}

// Make sure the fields are inputted properly for the change password form and send a put request
function checkPassword(fields) {
  // Remove red outline of boxes
  removeDanger(fields);
  // Loop through fields to see if they are filled
  var filled = allFieldsFilled(fields);
  // Check if password and retype password field matches
  var valid = passwordsMatch(fields);
  if (filled && valid) {
    var values = {password: fields[0][0].value};
    // Update password
    $.ajax({
      url: '/api/users/my/password',
      method: 'PUT',
      data: values,
      success: function () {
        successAlert('Success!');
      },
      error: function (data) {
        failureAlert(data.responseJSON.message);
      }
    });
  }

}

// Hide the form that is not active
function hideForms(forms) {
  for (var i = 0; i < forms.length; i++) {
    forms[i].style.display = 'none'
  }
}
// Remove red outline around fields
function removeDanger(fields) {
  for (var i = 0; i < fields.length; i++) {  // Loop through the fields and remove the red outline if there is one
    fields[i].removeClass('is-danger');
  }
}
// Check if all of the input fields have text in them
function allFieldsFilled(fields) {
  for (var i = 0; i < fields.length; i++) {
    if (fields[i][0].value === '') {
      failureAlert('Please fill out the ' + fields[i][0].id);
      return false;
    }
  }
  return true;
}
// Check if the password and retype password fields match
function passwordsMatch(fields) {
  if (fields[0][0].value === fields[1][0].value) {
    return true;
  }
  failureAlert('Passwords do not match!');
  return false;
}

function failureAlert(message) {
  $('#alert').text(message).removeClass('is-success').addClass('is-danger').css({
    opacity: 0,
    visibility: "visible"
  }).animate({opacity: 1}, 400);
}
function successAlert(message) {
  $('#alert').text(message).removeClass('is-danger').addClass('is-success').css({
    opacity: 0,
    visibility: "visible"
  }).animate({opacity: 1}, 400);
  window.setTimeout(function () {
    $('#alert').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 400);
  }, 2500);
}
// fade in
//$('#alert').text('hi').removeClass('is-success').addClass('is-danger').css({opacity: 0, visibility: "visible"}).animate({opacity: 1}, 2000);

// Fade out
//$('#alert').text('hi').removeClass('is-success').addClass('is-danger').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 2000);
