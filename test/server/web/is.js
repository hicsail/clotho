const Code = require('code');
const Is = require('../../../server/web/helpers/is');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const context = {
  inverse: function () {

    return false;
  },
  fn: function() {

    return true;
  }
};

lab.experiment('is', () => {

  lab.test('1 == 1', (done) => {

    Code.expect(Is(1, '==', 1, context)).to.equal(true);
    done();
  });

  lab.test('1 != 1', (done) => {

    Code.expect(Is(1, '!=', 1, context)).to.equal(false);
    done();
  });

  lab.test('1 > 1', (done) => {

    Code.expect(Is(1, '>', 1, context)).to.equal(false);
    done();
  });

  lab.test('1 >= 1', (done) => {

    Code.expect(Is(1, '>=', 1, context)).to.equal(true);
    done();
  });

  lab.test('1 < 1', (done) => {

    Code.expect(Is(1, '<', 1, context)).to.equal(false);
    done();
  });

  lab.test('1 <= 1', (done) => {

    Code.expect(Is(1, '<=', 1, context)).to.equal(true);
    done();
  });

  lab.test('blank', (done) => {

    Code.expect(Is(context)).to.equal(false);
    done();
  });
});
