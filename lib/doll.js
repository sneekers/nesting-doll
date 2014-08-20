'use strict';

function Doll(name, namespace, state) {
  this.name = name;
  this.namespace = namespace;
  this.state = state;

  this._outer = null;
  this._previous = null;
}

Doll.OUTER = 'outer';
Doll.CURRENT = 'current';

Doll.prototype.outer = function () {
  return this._outer;
};

Doll.prototype.previous = function () {
  return this._previous;
};

Doll.prototype.bind = function (callback, context) {
  return this.namespace.bind(
    this._wrapCallback(callback),
    context || this.namespace.createContext()
  );
};

Doll.prototype.run = function (callback) {
  var wrappedCallback = this._wrapCallback(callback);

  var returnValue;
  this.namespace.run(function () {
    returnValue = wrappedCallback();
  });
  return returnValue;
};

Doll.prototype._wrapCallback = function (callback) {
  var self = this;

  function wrappedCallback() {
    var outer = self.namespace.get(Doll.OUTER);
    var previous = self.namespace.get(Doll.CURRENT);

    if (outer) {
      self._outer = outer;
    } else {
      // Only set outer if first transaction
      self.namespace.set(Doll.OUTER, self);
    }


    if (previous) {
      self._previous = previous;
    }

    // Always set previous for next transaction
    self.namespace.set(Doll.CURRENT, self);

    return callback.apply(null, arguments);
  }

  return wrappedCallback;
};

module.exports = Doll;
