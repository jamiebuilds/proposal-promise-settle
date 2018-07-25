const test = require('ava');
const { settle, AggregateError } = require('./');

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

test('Promise.settle', async t => {
  let waited = false;

  let result = await settle([
    Promise.resolve(1),
    Promise.reject(new Error('one')),
    Promise.resolve(2),
    Promise.reject(new TypeError('two')),
    wait(10).then(() => { waited = true; return 3; }),
  ]);

  t.true(waited);
  t.deepEqual(result, {
    fulfilled: [1, 2, 3],
    rejected: [
      new Error('one'),
      new TypeError('two')
    ],
  });
});

test('AggregateError', t => {
	let err = new AggregateError('some failures occured', [
    new Error('one'),
    new TypeError('two'),
  ]);

  t.is(err.name, 'AggregateError');
  t.regex(err.message, /some failures occured/);
	t.regex(err.message, /Error: one\n {8}at /);
	t.regex(err.message, /TypeError: two\n {8}at /);
  t.true(err instanceof Error);
  t.true(typeof err[Symbol.iterator] === 'function');
  t.deepEqual(Array.from(err), [
    new Error('one'),
    new TypeError('two')
  ]);
});
