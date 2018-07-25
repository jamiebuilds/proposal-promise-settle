'use strict';

function settle(promises) {
  let fulfilled = [];
  let rejected = [];

  let wrappedPromises = Array.from(promises).map(promise => {
    return promise.then(
      res => fulfilled.push(res),
      err => rejected.push(err),
    );
  });

  return Promise.all(wrappedPromises).then(() => {
    return { fulfilled, rejected };
  });
};

const errorsMap = new WeakMap();

function indent(str) {
  return str.replace(/^/mg, '    ');
}

class AggregateError extends Error {
  constructor(message, errors) {
    let errorsArr = Array.from(errors);
    super(message + '\n' + indent(errors.map(e => e.stack).join('\n')));
    this.name = 'AggregateError';
    errorsMap.set(this, errorsArr);
  }

  *[Symbol.iterator]() {
    for (let err of errorsMap.get(this)) {
      yield err;
    }
  }
}

exports.settle = settle;
exports.AggregateError = AggregateError;
