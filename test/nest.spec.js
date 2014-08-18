'use strict';

var Lab = require('lab');
var expect = require('chai').expect;

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.it;

var cls = require('continuation-local-storage');
var Nest = require('../lib/nest');

describe('Nest', function () {

  var namespace;
  var nest;
  beforeEach(function (done) {
    namespace = cls.createNamespace('foo');
    nest = new Nest(namespace, 'foo');
    done();
  });

  afterEach(function (done) {
    cls.destroyNamespace('foo');
    done();
  });

  describe('outer', function () {

    it('returns the outer most doll if given no arguments', function (done) {
      var outer = {
        foo: 'bar'
      };
      namespace.run(function () {
        namespace.set(Nest.OUTER, outer);

        var outerNest = nest.outer();

        expect(outerNest).to.equal(outer);
        done();
      });
    });

    it('sets the outer most doll if given an argument', function (done) {
      var outer = {
        foo: 'bar'
      };
      namespace.run(function () {
        nest.outer(outer);

        var outerNest = namespace.get(Nest.OUTER);

        expect(outerNest).to.equal(outer);
        done();
      });
    });
  });

  describe('previous', function () {

    it('returns the previous doll if given no arguments', function (done) {
      var previous = {
        foo: 'bar'
      };
      namespace.run(function () {
        namespace.set(Nest.PREVIOUS, previous);

        var previousNest = nest.previous();

        expect(previousNest).to.equal(previous);
        done();
      });
    });

    it('sets the previous doll if given an argument', function (done) {
      var previous = {
        foo: 'bar'
      };
      namespace.run(function () {
        nest.previous(previous);

        var previousNest = namespace.get(Nest.PREVIOUS);

        expect(previousNest).to.equal(previous);
        done();
      });
    });
  });

  describe('bind', function () {

    it('binds the given function', function (done) {

      var boundFn = nest.bind(function (key, value) {
        var boundNamespace = cls.getNamespace('foo');

        boundNamespace.set(key, value);

        expect(boundNamespace).to.equal(namespace);

        next(key, value);
      });

      function next(key, value) {
        var setValue = namespace.get(key);

        expect(setValue)
          .to.exist.and
          .to.equal(value);
        done();
      }

      boundFn('test', 1);
    });

    it('binds the given context to the given function', function (done) {
      var context = {
        foo: 'bar'
      };

      var boundFn = nest.bind(function () {
        expect(this).to.equal(context);
        done();
      }, context);

      boundFn();
    });

    it('returns the given functions return value', function (done) {
      var value = 'bar';

      var boundFn = nest.bind(function (value) {
        return value;
      });

      var setValue = boundFn(value);

      expect(setValue).to.equal(value);
      done();
    });

  });

  describe('run', function () {

    it('runs the given function', function (done) {
      var key = 'test';
      var value = 1;

      nest.run(function () {
        var boundNamespace = cls.getNamespace('foo');

        boundNamespace.set(key, value);

        expect(boundNamespace).to.equal(namespace);

        next();
      });

      function next() {
        var setValue = namespace.get(key);

        expect(setValue)
          .to.exist.and
          .to.equal(value);
        done();
      }
    });

    it('binds the given context to the given function', function (done) {
      var context = {
        foo: 'bar'
      };

      nest.run(function () {
        expect(this).to.equal(context);
        done();
      }, context);
    });

    it('returns the given functions return value', function (done) {
      var value = 'bar';

      var setValue = nest.run(function () {
        return value;
      });


      expect(setValue).to.equal(value);
      done();
    });

  });

  describe('_wrapCallback', function () {

    var callback;
    beforeEach(function (done) {
      callback = nest._wrapCallback(function foo() {});
      done();
    });

    it('returns a wrapped function', function (done) {
      expect(callback.name).to.equal('wrappedCallback');
      done();
    });

    it('sets outer most nest if none exists', function (done) {
      namespace.run(function () {
        expect(namespace.get(Nest.OUTER)).to.not.exist;

        callback();

        expect(namespace.get(Nest.OUTER)).to.equal(nest);
        done();
      });
    });

    it('sets _outer if outer exists', function (done) {
      namespace.run(function () {
        var outer = {
          foo: 'bar'
        };

        namespace.set(Nest.OUTER, outer);

        callback();

        expect(nest._outer).to.equal(outer);
        done();
      });
    });

    it('sets this nest as previous', function (done) {
      namespace.run(function () {
        expect(namespace.get(Nest.PREVIOUS)).to.not.exist;

        callback();

        expect(namespace.get(Nest.PREVIOUS)).to.equal(nest);
        done();
      });
    });

    it('sets _previous if previous exists', function (done) {
      namespace.run(function () {
        var previous = {
          foo: 'bar'
        };

        namespace.set(Nest.PREVIOUS, previous);

        callback();

        expect(nest._previous).to.equal(previous);
        done();
      });
    });

  });

  describe('integration', function () {

    it('properly handles nested dolls', function (done) {
      var nestTwo = new Nest(namespace, 'bar');
      var nestThree = new Nest(namespace, 'test');

      nest.run(function () {
        expect(nest._outer).to.not.exist;
        expect(nest._previous).to.not.exist;

        nestTwo.run(function () {
          expect(nestTwo._outer).to.equal(nest);
          expect(nestTwo._previous).to.equal(nest);

          nestThree.run(function () {
            expect(nestThree._outer).to.equal(nest);
            expect(nestThree._previous).to.equal(nestTwo);
            done();
          });
        });
      });

    });

    it('does not conflate separate nests', function (done) {
      var called = 0;
      function reallyDone() {
        called += 1;
        if (called === 3) {
          done();
        }
      }

      var nestTwo = new Nest(namespace, 'bar');
      var nestThree = new Nest(namespace, 'test');

      nest.run(function () {
        expect(nest._outer).to.not.exist;
        expect(nest._previous).to.not.exist;

        setTimeout(function () {
          nestTwo.run(function () {
            expect(nestTwo._outer).to.equal(nest);
            expect(nestTwo._previous).to.equal(nest);

            nestThree.run(function () {
              expect(nestThree._outer).to.equal(nest);
              expect(nestThree._previous).to.equal(nestTwo);
              reallyDone();
            });
          });
        }, 10);
      });

      process.nextTick(function () {
        var nest = new Nest(namespace, 'foo');
        var nestTwo = new Nest(namespace, 'bar');
        var nestThree = new Nest(namespace, 'test');

        nestThree.run(function () {
          expect(nestThree._outer).to.not.exist;
          expect(nestThree._previous).to.not.exist;

          nestTwo.run(function () {
            expect(nestTwo._outer).to.equal(nestThree);
            expect(nestTwo._previous).to.equal(nestThree);

            nest.run(function () {
              expect(nest._outer).to.equal(nestThree);
              expect(nest._previous).to.equal(nestTwo);
              reallyDone();
            });
          });
        });
      });

      process.nextTick(function () {
        var nest = new Nest(namespace, 'foo');
        var nestTwo = new Nest(namespace, 'bar');
        var nestThree = new Nest(namespace, 'test');

        nestThree.run(function () {
          expect(nestThree._outer).to.not.exist;
          expect(nestThree._previous).to.not.exist;

          process.nextTick(function () {
            nestTwo.run(function () {
              expect(nestTwo._outer).to.equal(nestThree);
              expect(nestTwo._previous).to.equal(nestThree);

              setTimeout(function () {
                nest.run(function () {
                  expect(nest._outer).to.equal(nestThree);
                  expect(nest._previous).to.equal(nestTwo);
                  reallyDone();
                });
              }, 0);
            });
          });
        });
      });

    });

  });
});
