'use strict';

mocha.setup('tdd');

var assert = chai.assert;

suite('history', function() {
    this.beforeEach(function() {
        $f.history.clearHistory();
    });

    suite('getHistory()', function() {
        test('Returns an empty array when there is no history', function() {
            assert.deepEqual($f.history.getHistory(), []);
        });

        test('Returns the history', function() {
            $f.history.addHistory('test');
            assert.deepEqual($f.history.getHistory(), ['test']);
        });
    });

    suite('addHistory()', function() {
        test('Sets the history in reverse chronological order', function() {
            $f.history.addHistory('first');
            $f.history.addHistory('second');
            assert.deepEqual($f.history.getHistory(), ['second', 'first']);
        });

        test('Limits the history to the 10 most recent events', function() {
            var i;
            var expected = [];
            for (i = 1; i < 11; i += 1) {
                expected.unshift('test' + i);
            }

            for (i = 0; i < 11; i += 1) {
                $f.history.addHistory('test' + i);
            }
            assert.deepEqual($f.history.getHistory(), expected);
        });
    });

    suite('clearHistory()', function() {
        test('clears the history', function() {
            $f.history.addHistory('test');
            $f.history.clearHistory();
            assert.deepEqual($f.history.getHistory(), []);
        });
    });
});
