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
var Nest = require('../lib/nest');

describe('NestingDoll', function () {
  var doll;

  beforeEach(function (done) {
    doll = NestingDoll.getDoll();
    done();
  });

  afterEach(function (done) {
    // Clear instance
    doll = NestingDoll.INSTANCE = null;
    done();
  });

  describe('getDoll', function () {

    it('returns a new instance of NestingDoll', function (done) {
      expect(doll)
        .to.exist.and
        .to.equal(NestingDoll.INSTANCE);
      done();
    });

    it('returns the same instance of NestingDoll after subsequent calls', function (done) {
      var dollTwo = NestingDoll.getDoll();

      expect(dollTwo)
        .to.exist.and
        .to.equal(doll).and
        .to.equal(NestingDoll.INSTANCE);
      done();
    });

    it('is an instance of EventEmitter', function (done) {
      expect(doll).to.be.instanceOf(Events.EventEmitter);
      done();
    });

    it('initializes the main CLS namespace', function (done) {
      expect(doll._namespace)
        .to.exist.and
        .to.equal(cls.getNamespace(NestingDoll.NAMESPACE));
      done();
    });

  });

  describe('nest', function () {

    it('returns a Nest object', function (done) {
      var nest = doll.nest('foo');

      expect(nest).to.be.instanceOf(Nest);
      done();
    });

    it('has set namespace, name and data', function (done) {
      var data = {
        foo: 'bar'
      };
      var nest = doll.nest('foo', data);

      expect(nest).to.have.property('namespace', doll._namespace);
      expect(nest).to.have.property('name', 'foo');
      expect(nest).to.have.property('data', data);
      done();
    });

    it('supports binding a callback', function (done) {
      var res = {
        foo: 'bar'
      };
      var callback = doll.nest('foo').bind(function (err, data) {
        expect(data).to.equal(res);
        done();
      });

      callback(null, res);
    });

    it('supports directly running a function', function (done) {
      doll.nest('foo').run(function () {
        expect(true).to.be.true;
        done();
      });
    });

  });

});
