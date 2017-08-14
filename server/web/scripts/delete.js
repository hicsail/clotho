var deleteButton = $('#delete-all');
var undeleteButton = $('#un-delete');

deleteButton.click(function() {
  deleteButton.addClass('is-loading');
  if(deleteButton.text() == 'Delete All') {
    setTimeout(function() {
      deleteButton.removeClass('is-loading');
      deleteButton.text('Confirm Delete By Clicking Again');
    }, 1000);
  } else {
    $.post('../api/delete',{}, function(result) {
      deleteButton.removeClass('is-loading');
      deleteButton.removeClass('is-danger');
      deleteButton.addClass('is-success');
      deleteButton.text('Success');
      deleteButton.attr("disabled","disabled");
    });
  }
});

undeleteButton.click(function() {
  undeleteButton.addClass('is-loading');
  if(undeleteButton.text() == 'Un-delete All') {
    setTimeout(function() {
      undeleteButton.removeClass('is-loading');
      undeleteButton.text('Confirm Un-delete By Clicking Again');
    }, 1000);
  } else {
    $.post('../api/undelete',{}, function(result) {
      undeleteButton.removeClass('is-loading');
      undeleteButton.removeClass('is-info');
      undeleteButton.addClass('is-success');
      undeleteButton.text('Success');
      undeleteButton.attr("disabled","disabled");
    });
  }
});
