$('#login').on('submit', function (e) {
  e.preventDefault();

  // Store the input values in an object variable
  var values = {};
  $.each($('#login').serializeArray(), function (i, field) {
    values[field.name] = field.value;
  });
  values.application = 'Clotho Web'; // add application name
  // If the user exists, redirect to home page, if not show an alert
  $.post('/api/login', values, function (data) {
    location.reload();
  }).fail(function (data) {
    var message = data.responseJSON.message;
    failureAlert(message);
  });
});
