'use strict';

function Doll(name, namespace, data) {
  this.name = name;
  this.namespace = namespace;
  this.data = data;

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
    this._wrapCallback(callback, context),
    this.namespace.createContext()
  );
};

Doll.prototype.run = function (callback, context) {
  var wrappedCallback = this._wrapCallback(callback, context);

  var returnValue;
  this.namespace.run(function () {
    returnValue = wrappedCallback();
  });
  return returnValue;
};

Doll.prototype._wrapCallback = function (callback, context) {
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

    return callback.apply(context, arguments);
  }

  return wrappedCallback;
};

module.exports = Doll;
