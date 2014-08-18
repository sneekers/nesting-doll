'use strict';

var Events = require('events');
var util = require('util');
var cls = require('continuation-local-storage');

var Nest = require('./lib/nest');
var Utilities = require('./lib/utilities');

var exports = module.exports = {
  NAMESPACE: '__NS__nesting_doll',
  INSTANCE: null,

  Constructor: NestingDoll,

  getDoll: function (options) {
    if (exports.INSTANCE) {
      return exports.INSTANCE;
    }

    var logger = new NestingDoll(options);
    exports.INSTANCE = logger;

    return logger;
  }
};

function NestingDoll() {
  Events.EventEmitter.call(this);
  // Get or create namespace for tracking transactions
  this._namespace = cls.getNamespace(exports.NAMESPACE) || cls.createNamespace(exports.NAMESPACE);
}

util.inherits(NestingDoll, Events.EventEmitter);

NestingDoll.prototype.nest = function (name, data) {
  return new Nest(this._namespace, name, data);
};
