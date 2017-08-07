function promote(username) {

  var button = $('#' + username);
  button.addClass('is-loading');
  payload = {
    username: username,
  };

  $.post('../api/admins/promote', payload, function (result) {
    button.removeClass('is-loading');
    if(result.user.name == username){
      button.removeClass('is-light');
      button.addClass('is-success');
      button.text('Success');
    } else {
      button.text('FAILED');
    }
    button.attr("disabled","disabled");
  });
}

function demote(username) {

  var button = $('#' + username);
  button.addClass('is-loading');
  payload = {
    username: username,
  };

  $.post('../api/admins/demote', payload, function (result) {
    button.removeClass('is-loading');
    if(result.message){
      button.removeClass('is-danger');
      button.addClass('is-success');
      button.text('Success');
    } else {
      button.text('FAILED');
    }
    button.attr("disabled","disabled");
  });
}
