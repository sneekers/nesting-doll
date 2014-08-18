'use strict';

function Nest(namespace, name, data) {
  this.namespace = namespace;
  this.name = name;
  this.data = data;

  this._outer = null;
  this._previous = null;
}

Nest.OUTER = '__NS__outer'; 
Nest.PREVIOUS = '__NS__previous'; 

Nest.prototype.outer = function (outer) {
  if (outer) {
    this.namespace.set(Nest.OUTER, outer);
    return;
  }

  return this.namespace.get(Nest.OUTER);
};

Nest.prototype.previous = function (previous) {
  if (previous) {
    this.namespace.set(Nest.PREVIOUS, previous);
    return;
  }

  return this.namespace.get(Nest.PREVIOUS);
};

Nest.prototype.bind = function (callback, context) {
  return this.namespace.bind(
    this._wrapCallback(callback, context),
    this.namespace.createContext()
  );
};

Nest.prototype.run = function (callback, context) {
  var wrappedCallback = this._wrapCallback(callback, context);

  var returnValue;
  this.namespace.run(function () {
    returnValue = wrappedCallback();
  });
  return returnValue;
};

Nest.prototype._wrapCallback = function (callback, context) {
  var self = this;

  function wrappedCallback() {
    var outer = self.outer();
    var previous = self.previous();

    if (outer) {
      self._outer = outer;
    } else {
      // Only set outer if first transaction
      self.outer(self);
    }


    if (previous) {
      self._previous = previous;
    }

    // Always set previous for next transaction
    self.previous(self);

    return callback.apply(context, arguments);
  }

  return wrappedCallback;
};

module.exports = Nest;
