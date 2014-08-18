'use strict';

var Lab = require('lab');
var expect = require('chai').expect;

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;

var cls = require('continuation-local-storage');
var Utilities = require('../lib/utilities');

describe('Utilities', function () {

  describe('bindNamespace', function () {

    it('binds the given namespace to the given function', function (done) {
      var namespace = cls.createNamespace('foo');

      var boundFn = Utilities.bindNamespace(namespace, function (key, value) {
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
      var namespace = cls.createNamespace('foo');
      var context = {
        foo: 'bar'
      };

      var boundFn = Utilities.bindNamespace(namespace, function () {
        expect(this).to.equal(context);
        done();
      }, context);

      boundFn();
    });

    it('allows use of namespace immediately', function (done) {
      var namespace = cls.createNamespace('foo');
      var value = 'bar';

      var boundFn = Utilities.bindNamespace(namespace, function (key, value) {
        namespace.set(key, value);

        return namespace.get(key);
      });

      var setValue = boundFn('foo', value);

      expect(setValue).to.equal(value);
      done();
    });

  });

  describe('runNamespace', function () {

    it('runs the given function from the given namespace', function (done) {
      var namespace = cls.createNamespace('foo');

      var key = 'test';
      var value = 1;
      Utilities.runNamespace(namespace, function () {
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
      var namespace = cls.createNamespace('foo');
      var context = {
        foo: 'bar'
      };

      Utilities.runNamespace(namespace, function () {
        expect(this).to.equal(context);
        done();
      }, context);
    });

    it('allows use of namespace immediately', function (done) {
      var namespace = cls.createNamespace('foo');
      var key = 'foo';
      var value = 'bar';

      var setValue = Utilities.runNamespace(namespace, function () {
        namespace.set(key, value);

        return namespace.get(key);
      });


      expect(setValue).to.equal(value);
      done();
    });

  });

});
