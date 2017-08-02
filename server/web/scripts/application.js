$("#cancel").hide();
$("#name").keyup(function () {
  $("#exampleName").text($("#name").val());
  $("#exampleWebsite").text('Visit ' + $("#name").val());
});

$("#imageURL").keyup(function () {
  $("#exampleImageUrl").attr('src', $("#imageURL").val());
});

$("#description").keyup(function () {
  $("#exampleDescription").text($("#description").val());
});

$("#website").keyup(function () {
  $("#exampleWebsite").attr('href', $("#website").val());
});

$("#createApp").submit(function (event) {
  event.preventDefault();
  if($("#ID").val() == "") {
    var body = {
      name: $("#name").val(),
      description: $("#description").val(),
      imageURL: $("#imageURL").val(),
      website: $("#website").val()
    }
    $.post('../api/application', body, function (data) {
      if (data._id) {
        successAlert('Application Created');
      } else {
        failureAlert(data.toString());
      }
    })
  } else {
    var body = {
      name: $("#name").val(),
      description: $("#description").val(),
      imageURL: $("#imageURL").val(),
      website: $("#website").val()
    }
    $.ajax({
      url: "../api/application/" + $('#ID').val(),
      method: 'PUT',
      data: body,
      success: function () {
        successAlert('Application Updated');
      },
      error: function () {
        failureAlert('Update Failed');
      }
    });
  }

});

$("#cancel").click(function () {
  $("#cancel").hide();
  $('#title').text('Add Application');
  $('#submit').val('Submit');
  $("#name").val('App Name').keyup();
  $("#description").val('App Description').keyup();
  $("#imageURL").val('http://bulma.io/images/placeholders/1280x960.png').keyup();
  $("#website").val('http://github.com').keyup();
  $("#ID").val('');
});

function editCard(id, name, description, imageURL, website) {
  $("#cancel").show();
  $('#title').text('Edit Application');
  $('#submit').val('Edit');
  $("#name").val(name).keyup();
  $("#description").val(description).keyup();
  $("#imageURL").val(imageURL).keyup();
  $("#website").val(website).keyup();
  $("#ID").val(id);
  console.log(id, name, description, imageURL, website);
}
