var editor = ace.edit("editor");
editor.setReadOnly(true);
$('#language').val(language);

var tag = $('#tag');
if (working) {
  tag.removeClass('is-danger');
  tag.removeClass('is-light');
  tag.addClass('is-success');
  tag.html('Test Passed')
}

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true
});
switch (language) {
  case 'node':
    editor.getSession().setMode("ace/mode/javascript");
    break;
  case 'java':
    editor.getSession().setMode("ace/mode/java");
    break;
  case 'python':
    editor.getSession().setMode("ace/mode/python");
    break;
}
$('#language').on('change', function() {
  var language = $(this).find(":selected").val();
  $.get('/api/function/template/' + language,function(response) {
    editor.setValue(response);
    switch(language) {
      case 'node':
        editor.getSession().setMode("ace/mode/javascript");
        break;
      case 'java':
        editor.getSession().setMode("ace/mode/java");
        break;
      case 'python':
        editor.getSession().setMode("ace/mode/python");
        break;
    }
  });
});
editor.setShowPrintMargin(false);

$('#run').click(function() {
  $('#userInput').removeClass('is-danger');
  if(!$('#language').val()) {
    $('#console').val('Please select a language');
    failureAlert('Please select a language');
    return;
  }
  if(!$('#inputs').val()) {
    $('#console').val('Please provide at lease one input');
    failureAlert('Please provide at lease one input');
    return;
  }
  if(!editor.getValue()) {
    $('#console').val('Function can not be blank');
    failureAlert('Function can not be blank');
    return;
  }
  var button = $('#run');
  var tag = $('#tag');
  $('#console').val('');
  button.addClass('is-loading');
//  tag.removeClass('is-danger');
//  tag.removeClass('is-success');
//  tag.addClass('is-light');
//  tag.html('Running');
  var language = $('#language').val();
  var code = editor.getValue();
  var inputs = JSON.stringify($('#userInput').val().split('\n'));
  var data = language + ' ' + inputs + '\n' + code;
  var done = false;
  $.ajax({
    type: 'POST',
    url: '/api/function/run',
    dataType: 'text',
    data: data,
    headers: {'Content-Type':'text/plain'},
    success: function (response) {
      done = true;
//      tag.removeClass('is-light');
      if (response.split(' ')[0] === 'Exception') {
        $('#userInput').addClass('is-danger');
        $('#console').val('Please enter a valid input');

      } else {
        $('#console').val(response);
      }

      //var outputs = $('#outputs').val().split('\n');
      //var functionOutputs = response.split('\n').slice(0,-1);
//      if(JSON.stringify(functionOutputs) == JSON.stringify(outputs)) {
//        tag.addClass('is-success');
//        tag.html('Test Passed');
//      } else {
//        tag.addClass('is-danger');
//        tag.html('Test Failed');
//      }
      button.removeClass('is-loading');
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      done = true;
      tag.addClass('is-danger');
      tag.html('Test Failed');
      $('#console').val(textStatus);
      button.removeClass('is-loading');
    }
  });
  setTimeout(function () {
    if(!done){
      tag.addClass('is-danger');
      tag.html('Test Failed');
      button.removeClass('is-loading');
      $('#console').val('Process timed out');
    }
  },8000);
});
