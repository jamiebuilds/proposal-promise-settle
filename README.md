# Proposal: `Promise.settle` & `AggregateError`

> This repository is a work in progress and not seeking feedback yet.

## Example

```js
let results = await Promise.settle([
  Promise.resolve(1),
  Promise.reject(new Error('one')),
  Promise.resolve(2),
  Promise.reject(new TypeError('two')),
]);

results; // => { fulfilled: [1, 2], rejected: [Error, TypeError] }

if (results.rejected.length) {
  throw new AggregateError(results.rejected);
  /*
    AggregateError:
        Error: one
            at Object.<anonymous> (/path/to/example.js:3:18)
        TypeError: two
            at Object.<anonymous> (/path/to/example.js:5:18)
        at Object.<anonymous> (/path/to/example.js:14:9)
        at Object.<anonymous> (/path/to/example.js:14:9)
        at ...
  */
}
```

## Prior Art

- [aggregate-error](https://www.npmjs.com/package/aggregate-error)
- [Bluebird AggregateError](http://bluebirdjs.com/docs/api/aggregateerror.html)
- [C# AggregateException](https://msdn.microsoft.com/en-us/library/system.aggregateexception(v=vs.110).aspx)

## Motivation

### `Promise.settle` motivation

```js
await Promise.all([
  fetch({ method: 'POST', url: 'https://example.com/api/entities', body: ... }),
  fetch({ method: 'POST', url: 'fails', body: ... }),
  fetch({ method: 'POST', url: 'https://example.com/api/entities', body: ... }),
]);
```

When using `Promise.all`, a single failure means that the promise is rejected
immediately and you have no way to know:

- Which items succeeded
- Which items failed (other than the first)

Because the promise is rejected immediately, it does not wait to find out the
statuses of the unresolved promise. So you still have promises being run while
you're already handling their "failure".

```js
try {
  await Promise.all(...);
} catch {
  // promises are still running above
}
```

[WIP]

### `AggregateError` motivation

Today, when you have a set of errors, there's no clear way to collect them into
a single error. Developers end up encoding a subset of information inside error
messages or ignore the original errors altogether.

For example, if you were writing a bunch of files and some of them failed:

```js
let failed = [];

await Promise.all(files.map(async file => {
  try {
    await readFile(file);
  } catch {
    failed.push(file);
  }
}));

if (failed.length) {
  throw new Error(`Some files failed to write: ${failed.join(', ')}`);
}
```

However, there are many different reasons a file could fail to write, and
there's lots of metadata on our errors that we are missing out on:

```js
Error {
  message: "ENOENT: no such file or directory, open 'missing-file'"
  errno: -2,
  syscall: "open",
  code: "ENOENT",
  path: "missing-file"
}
```

But if we had an `AggregateError` class which held many different errors, we
could throw something more meaningful.

```js
let errors = [];

await Promise.all(files.map(async file => {
  try {
    await readFile(file);
  } catch (err) {
    errors.push(err);
  }
}));

if (errors.length) {
  throw new AggregateError(errors);
}
```

Using it like this:

```js
try {
  await readFiles();
} catch (err) {
  if (err instanceof AggregateError) {
    for (let error of err) {
      /*
        Error {
          message: "ENOENT: no such file or directory, open 'missing-file'"
          errno: -2,
          syscall: "open",
          code: "ENOENT",
          path: "missing-file"
        }
      */
    }
  }
}
```

[WIP]

### All Together

[WIP]

```js
let {rejected} = await Promise.settle(files.map(readFile));
let errs = rejected.filter(e => e.code !== 'ENOENT');
if (errs.length) throw new AggregateError(errs);
```
