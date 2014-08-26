# Nesting Doll

This library is a simple component for building nested contexts/scopes
(leveraging [continuation-local-storage](https://github.com/othiym23/node-continuation-local-storage))
which can be used for things such as a transaction logger. In fact, I build this expressly to be the
foundation for a nested transaction logger.

It exposes [dolls](https://github.com/sneekers/nesting-doll/#new-dollname-namespace-state) which are containers
for the current level context. Each **doll** has its own "state" which is specific to that container.
Each nested doll you create, it tracks the outer most doll and the previous doll, which can be used to track
the top transaction and the previous transaction as you go down.

## Install
```sh
npm install nesting-doll
```

## API

```js
var NestingDoll = require('nesting-doll');
var nestingDoll = NestingDoll.getDoll();

// or

var nestingDoll = new NestingDoll();
```

### nestingDoll.nest(name, [state])
Creates new doll with given name and prepopulated with the data given as the dolls state.
```js
var doll = nestingDoll.nest('foo', {timestamp: Date.now()});
```

### nestingDoll.currentDoll()
Returns the current active doll.
```js
nestingDoll.nest('foo').run(function () {
  var doll = nestingDoll.currentDoll();
  doll.set('test', 'value');
  asyncFunction('foo', fooCallback);
});

function fooCallback(err, value) {
  var doll = nestingDoll.currentDoll();

  console.log(doll.name);        // => 'foo'
  console.log(doll.get('test')); // => 'value'

  nestingDoll.nest('bar').run(function () {
    var doll = nestingDoll.currentDoll();
    doll.set('pizza', 'Is good!');
    asyncFunction('bar', barCallback);
  });
}

function barCallback(err, value) {
  var doll = nestingDoll.currentDoll();

  console.log(doll.name);                   // => 'bar'
  console.log(doll.get('test'));            // => undefined
  console.log(doll.get('pizza'));           // => 'Is good!'
  console.log(doll.previous().get('test')); // => 'value'
}
```

### new Doll(name, namespace, [state])
Doll is an internal class and should not really be used on its own, but does house most of the
functionality. Namespace is a CLS namespace.
```js
var doll = nestingDoll.nest(name);

// is the same as

var doll = new Doll(name, namespace);
```

### doll.run(function)
Run is an easy way to directly create a new doll context which any function inside of will have access to.
```js
var doll = nestingDoll.nest('foo');

doll.run(function () {
  // doll context is available here, and any functions inside of this callstack
  // will have access to this doll as well by calling nestingDoll.currentDoll()
});
```

### doll.bind(function, [context])
Bind allows you to wrap a function so when it is called, the context is created automatically.
You can optionally pass in a CLS namespace context, which attaches the doll to that context.
```js
var doll = nestingDoll.nest('foo');
var boundAsyncFn = doll.bind(asyncFn);

boundAsyncFn('foo', function (err, value) {
  // you have access to the doll context and other things similarly to doll.run
});
```

### doll.rawBind(function, [context])
Raw bind is meant to bind a function similarly to doll.bind() above, but does not run the
doll nesting functionality (which sets outer and previous dolls). This was created specifically
to assist in binding multiple functions to the same doll context without running the nesting
code more than once.
```js
function createTransaction(name, transaction, callback) {
  var doll = nestingDoll.nest(name);

  // Creates CLS context
  var context = doll.namespace.createContext();

  var endTransaction = doll.rawBind(function () {
    doll.deactivate();

    var time = doll.get('timestamp');
    doll.set('diff', Date.now() - time);

    callback.apply(null, arguments);
  }, context);

  var startTransaction = doll.bind(function () {
    doll.activate();

    doll.set('timestamp', Date.now());
    transaction(endTransaction);
  }, context);

  startTransaction();
}

function asyncFn(key, callback) {
  // create nested transaction
  createTransaction(
    'db.find',
    function (end) {
      var currentDoll = nestingDoll.currentDoll();
      var previousDoll = currentDoll.previous();

      console.log(currentDoll.name);  // => 'db.find'
      console.log(previousDoll.name); // => 'asyncFn'

      db.find(key, end);
    },
    callback
  );
}

createTransaction(
  'asyncFn',
  function (end) {
    asyncFn('key', end);
  },
  function (err, value) {
    // your transaction is finished

    var currentDoll = nestingDoll.currentDoll();
    var previousDoll = currentDoll.previous();

    console.log(currentDoll.name); // => 'asyncFn'
    console.log(previousDoll);     // => 'null'
  }
);

// The above code runs asyncFn which itself runs db.find, which are both nested dolls
// and can be managed or read separately.
```

### doll.previous() or doll.outer()
Returns the previous or outer most doll based on this current doll.
See examples above for usage.

### doll.activate() or doll.deactivate()
This activates or deactivates a doll. Dolls are not activated by default, which means
until you activate the doll, you won't be able to nest any other dolls inside of it.

This is useful for explicitly ending a doll based transaction, so subsequent dolls
that aren't nested but called in the same scope do not polute your nested scope.

## Credits
This library is born from the CLS module which [othiym23](https://github.com/othiym23)
created. All of the *magic* comes CLS, while allowing this to stay simple and straight forward.

### License
MIT
