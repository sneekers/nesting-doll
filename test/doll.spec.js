'use strict';

var Lab = require('lab');
var expect = require('chai').expect;

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.it;

var cls = require('continuation-local-storage');
var Doll = require('../lib/doll');

describe('Doll', function () {

  var namespace;
  var doll;
  beforeEach(function (done) {
    namespace = cls.createNamespace('foo');
    doll = new Doll('foo', namespace);
    done();
  });

  afterEach(function (done) {
    cls.destroyNamespace('foo');
    done();
  });

  describe('outer', function () {

    it('returns the outer most doll assigned to this doll', function (done) {
      var outer = {
        foo: 'bar'
      };
      doll._outer = outer;
      var outerDoll = doll.outer();

      expect(outerDoll).to.equal(outer);
      done();
    });

  });

  describe('previous', function () {

    it('returns the previous doll assigned to this doll', function (done) {
      var previous = {
        foo: 'bar'
      };
      doll._previous = previous;
      var previousDoll = doll.previous();

      expect(previousDoll).to.equal(previous);
      done();
    });

  });

  describe('bind', function () {

    it('binds the given function', function (done) {

      var boundFn = doll.bind(function (key, value) {
        var boundNamespace = cls.getNamespace('foo');

        boundNamespace.set(key, value);

        expect(boundNamespace).to.equal(namespace);

        var setValue = namespace.get(key);

        expect(setValue)
          .to.exist.and
          .to.equal(value);
        done();
      });

      boundFn('test', 1);
    });

    it('binds the given context to the given function', function (done) {
      var context = {
        foo: 'bar'
      };

      var boundFn = doll.bind(function () {
        expect(namespace.active).to.equal(context);
        done();
      }, context);

      boundFn();
    });

    it('returns the given functions return value', function (done) {
      var value = 'bar';

      var boundFn = doll.bind(function (value) {
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

      doll.run(function () {
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

    it('returns the given functions return value', function (done) {
      var value = 'bar';

      var setValue = doll.run(function () {
        return value;
      });


      expect(setValue).to.equal(value);
      done();
    });

  });

  describe('_wrapCallback', function () {

    var callback;
    beforeEach(function (done) {
      callback = doll._wrapCallback(function foo() {});
      done();
    });

    it('returns a wrapped function', function (done) {
      expect(callback.name).to.equal('wrappedCallback');
      done();
    });

    it('sets outer most doll if none exists', function (done) {
      namespace.run(function () {
        expect(namespace.get(Doll.OUTER)).to.not.exist;

        callback();

        expect(namespace.get(Doll.OUTER)).to.equal(doll);
        done();
      });
    });

    it('sets _outer if outer exists', function (done) {
      namespace.run(function () {
        var outer = {
          foo: 'bar'
        };

        namespace.set(Doll.OUTER, outer);

        callback();

        expect(doll._outer).to.equal(outer);
        done();
      });
    });

    it('sets this doll as previous', function (done) {
      namespace.run(function () {
        expect(namespace.get(Doll.CURRENT)).to.not.exist;

        callback();

        expect(namespace.get(Doll.CURRENT)).to.equal(doll);
        done();
      });
    });

    it('sets _previous if previous exists', function (done) {
      namespace.run(function () {
        var previous = {
          foo: 'bar'
        };

        namespace.set(Doll.CURRENT, previous);

        callback();

        expect(doll._previous).to.equal(previous);
        done();
      });
    });

  });

  describe('integration', function () {

    it('properly handles nested dolls', function (done) {
      var dollTwo = new Doll('bar', namespace);
      var dollThree = new Doll('test', namespace);

      doll.run(function () {
        expect(doll._outer).to.not.exist;
        expect(doll._previous).to.not.exist;

        dollTwo.run(function () {
          expect(dollTwo._outer).to.equal(doll);
          expect(dollTwo._previous).to.equal(doll);

          dollThree.run(function () {
            expect(dollThree._outer).to.equal(doll);
            expect(dollThree._previous).to.equal(dollTwo);
            done();
          });
        });
      });

    });

    it('does not conflate separate dolls', function (done) {
      var called = 0;
      function reallyDone() {
        called += 1;
        if (called === 3) {
          done();
        }
      }

      var dollTwo = new Doll('bar', namespace);
      var dollThree = new Doll('test', namespace);

      doll.run(function () {
        expect(doll._outer).to.not.exist;
        expect(doll._previous).to.not.exist;

        setTimeout(function () {
          dollTwo.run(function () {
            expect(dollTwo._outer).to.equal(doll);
            expect(dollTwo._previous).to.equal(doll);

            dollThree.run(function () {
              expect(dollThree._outer).to.equal(doll);
              expect(dollThree._previous).to.equal(dollTwo);
              reallyDone();
            });
          });
        }, 10);
      });

      process.nextTick(function () {
        var doll = new Doll('foo', namespace);
        var dollTwo = new Doll('bar', namespace);
        var dollThree = new Doll('test', namespace);

        dollThree.run(function () {
          expect(dollThree._outer).to.not.exist;
          expect(dollThree._previous).to.not.exist;

          setImmediate(function () {
            dollTwo.run(function () {
              expect(dollTwo._outer).to.equal(dollThree);
              expect(dollTwo._previous).to.equal(dollThree);

              doll.run(function () {
                expect(doll._outer).to.equal(dollThree);
                expect(doll._previous).to.equal(dollTwo);
                reallyDone();
              });
            });
          });
        });
      });

      process.nextTick(function () {
        var doll = new Doll('foo', namespace);
        var dollTwo = new Doll('bar', namespace);
        var dollThree = new Doll('test', namespace);

        dollThree.run(function () {
          expect(dollThree._outer).to.not.exist;
          expect(dollThree._previous).to.not.exist;

          setTimeout(function () {
            dollTwo.run(function () {
              expect(dollTwo._outer).to.equal(dollThree);
              expect(dollTwo._previous).to.equal(dollThree);

              process.nextTick(function () {
                doll.run(function () {
                  expect(doll._outer).to.equal(dollThree);
                  expect(doll._previous).to.equal(dollTwo);
                  reallyDone();
                });
              });
            });
          }, 10);
        });
      });

    });

  });
});
