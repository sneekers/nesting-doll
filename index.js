'use strict';

var Events = require('events');
var util = require('util');
var cls = require('continuation-local-storage');

var Doll = require('./lib/doll');

var NAMESPACE = '__NS__nesting_doll';

function NestingDoll() {
  Events.EventEmitter.call(this);
  // Get or create namespace for tracking transactions
  this._namespace = cls.getNamespace(NAMESPACE) || cls.createNamespace(NAMESPACE);
}

util.inherits(NestingDoll, Events.EventEmitter);

NestingDoll.NAMESPACE = NAMESPACE;

NestingDoll.getDoll = function () {
  return new NestingDoll();
};

NestingDoll.prototype.nest = function (name, data) {
  return new Doll(name, this._namespace, data);
};

module.exports = NestingDoll;
