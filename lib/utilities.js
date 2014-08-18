'use strict';

function bindNamespace(namespace, callee, context) {
  return namespace.bind(function () {
    return callee.apply(context, arguments);
  });
}

function runNamespace(namespace, callee, context) {
  // Run immediate if no context given
  if (typeof context === 'undefined') {
    var returnee;
    namespace.run(function () {
      returnee = callee();
    });
    return returnee;
  }

  var boundCallee = bindNamespace.apply(null, arguments);
  return boundCallee();
}

module.exports = {
  bindNamespace: bindNamespace,
  runNamespace: runNamespace
};
