'use strict';

var Lab = require('lab');
var expect = require('chai').expect;

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.it;

var Events = require('events');
var cls = require('continuation-local-storage');

var NestingDoll = require('../');
var Doll = require('../lib/doll');

describe('NestingDoll', function () {
  var nestingDoll;

  beforeEach(function (done) {
    nestingDoll = NestingDoll.getDoll();
    done();
  });

  afterEach(function (done) {
    nestingDoll = null;
    done();
  });

  describe('constructor', function () {

    it('initializes the main CLS namespace', function (done) {
      expect(nestingDoll._namespace)
        .to.exist.and
        .to.equal(cls.getNamespace(NestingDoll.NAMESPACE));
      done();
    });

    it('returns an instance with the same namespace', function (done) {
      var nestingDollTwo = new NestingDoll();

      expect(nestingDollTwo).to.exist;
      expect(nestingDollTwo._namespace).to.equal(nestingDoll._namespace);
      done();
    });

    it('is an instance of EventEmitter', function (done) {
      expect(nestingDoll).to.be.instanceOf(Events.EventEmitter);
      done();
    });

  });

  describe('getDoll', function () {

    it('returns a new instance of NestingDoll', function (done) {
      expect(nestingDoll)
        .to.exist.and
        .to.be.instanceOf(NestingDoll);
      done();
    });

  });

  describe('nest', function () {

    it('returns a Doll object', function (done) {
      var doll = nestingDoll.nest('foo');

      expect(doll).to.be.instanceOf(Doll);
      done();
    });

    it('has set namespace, name and data', function (done) {
      var data = {
        foo: 'bar'
      };
      var doll = nestingDoll.nest('foo', data);

      expect(doll).to.have.property('namespace', nestingDoll._namespace);
      expect(doll).to.have.property('name', 'foo');
      expect(doll).to.have.property('data', data);
      done();
    });

    it('supports binding a callback', function (done) {
      var res = {
        foo: 'bar'
      };
      var callback = nestingDoll.nest('foo').bind(function (err, data) {
        expect(data).to.equal(res);
        done();
      });

      callback(null, res);
    });

    it('supports directly running a function', function (done) {
      nestingDoll.nest('foo').run(function () {
        done();
      });
    });

  });

});