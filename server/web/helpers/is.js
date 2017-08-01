var _ = require('lodash');

var isHelper = function (left, operator, right, context) {

  if (_.isEmpty(context)) {
    return false;
  }
  var output = false;
  switch (operator) {
    case '==':
      output = left == right;
      break;
    case '!=':
      output = left != right;
      break;
    case '>':
      output = left > right;
      break;
    case '>=':
      output = left >= right;
      break;
    case '<':
      output = left < right;
      break;
    case '<=':
      output = left <= right;
      break;
  }

  if (output === true) {
    return context.fn(this);
  }
  return context.inverse(this);
};

module.exports = isHelper;
