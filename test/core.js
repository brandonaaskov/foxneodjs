'use strict';

mocha.setup('tdd');

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

suite('core', function() {
    suite('addEventListener()', function() {
        test.skip("Neglecting to pass in a callback throws an error", function() {
            assert.throws(function() {
                $f.addEventListener('noCallbackTest');
            }, "You can't create an event listener without supplying a callback function");
        });

        test.skip('Passing in nothing returns false', function() {
            assert.strictEqual($f.addEventListener(), false);
        });

        test.skip('Passing in null returns false', function() {
            assert.strictEqual($f.addEventListener(null, jQuery.noop()), false);
        });

        test.skip('Passing in undefined returns false', function() {
            assert.strictEqual($f.addEventListener(undefined, jQuery.noop()), false);
        });

        test.skip('Passing in an empty string returns false', function() {
            assert.strictEqual($f.addEventListener('', jQuery.noop()), false);
        });

        test.skip('Passing in an empty array returns false', function() {
            assert.strictEqual($f.addEventListener([], jQuery.noop()), false);
        });

        test.skip('Passing in an empty object returns false', function() {
            assert.strictEqual($f.addEventListener({}, jQuery.noop()), false);
        });

        test.skip('Passing in an anonymous function returns false', function() {
            assert.strictEqual($f.addEventListener(function() {}), false);
        });

        test.skip('Passing in a number returns false', function() {
            assert.strictEqual($f.addEventListener(10, jQuery.noop()), false);
        });

        test("Passing in a valid string of an event that doesn't already exist returns true", function() {
            $f.addEventListener('exists', function() {});
            assert.strictEqual($f.hasEventListener('exists'), true);
        });
    });

    suite('hasEventListener()', function() {
        this.afterEach(function() {
            $f.__test__ && $f.__test__.removeAllEventListeners();
        });

        test('Passing in nothing returns false', function() {
            assert.strictEqual($f.hasEventListener(), false);
        });

        test.skip('Passing in null returns false', function() {
            assert.strictEqual($f.hasEventListener(null, jQuery.noop()), false);
        });

        test.skip('Passing in undefined returns false', function() {
            assert.strictEqual($f.hasEventListener(undefined, jQuery.noop()), false);
        });

        test.skip('Passing in an empty string returns false', function() {
            assert.strictEqual($f.hasEventListener('', jQuery.noop()), false);
        });

        test.skip('Passing in an empty array returns false', function() {
            assert.strictEqual($f.hasEventListener([], jQuery.noop()), false);
        });

        test.skip('Passing in an empty object returns false', function() {
            assert.strictEqual($f.hasEventListener({}, jQuery.noop()), false);
        });

        test('Passing in an anonymous function returns false', function() {
            assert.strictEqual($f.hasEventListener(function() {}), false);
        });

        test("Passing in a valid string of an event that exists returns true", function() {
            $f.addEventListener('exists', function() {});
            assert.strictEqual($f.hasEventListener('exists'), true);
        });
    });

    suite('dispatch()', function() {
        this.afterEach(function() {
            $f.__test__ && $f.__test__.removeAllEventListeners();
        });

        test('Passing in nothing throws an error', function() {
            assert.throws(function() {
                $f.dispatch();
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in null returns false', function() {
            assert.throws(function() {
                $f.dispatch(null);
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in undefined returns false', function() {
            assert.throws(function() {
                $f.dispatch(undefined);
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in an empty string returns false', function() {
            assert.throws(function() {
                $f.dispatch('');
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in an empty array returns false', function() {
            assert.throws(function() {
                $f.dispatch([]);
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in an empty object returns false', function() {
            assert.throws(function() {
                $f.dispatch({});
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in an anonymous function returns false', function() {
            assert.throws(function() {
                $f.dispatch(function() {});
            }, "You can't dispatch an event without supplying an event name (as a string)");
        });

        test('Passing in a valid string returns true', function() {
            assert.strictEqual($f.dispatch('test'), true);
        });

        test('Dispatching over the window returns true', function() {
            assert.strictEqual($f.dispatch('test', true), true);
        });

        test.skip('Dispatching over foxneod works properly', function(done) {
            $f.addEventListener('test', function(response) {
                done();
            });

            $f.dispatch('test');
        });

        test.skip('Dispatching over foxneod with data works properly', function(done) {
            $f.addEventListener('test', function(event) {
                if (event.data.test === 'working') {
                    done();
                }
            });

            $f.dispatch('test', {
                test: 'working'
            });
        });

        test.skip('Dispatching over the window object works properly', function(done) {
            window.addEventListener('foxneod:test', function(response) {
                done();
            });

            $f.dispatch('test', {}, true);
        });

        test('Dispatching over the window object with data works properly', function(done) {
            window.addEventListener('foxneod:test', function(event) {
                if (event.data.test === 'working') {
                    done();
                }
            });

            $f.dispatch('test', {
                test: 'working'
            }, true);
        });
    });

    suite('removeEventListener()', function() {
        test.skip('Passing in nothing returns false', function() {
            assert.strictEqual($f.removeEventListener(), false);
        });

        test.skip('Passing in null returns false', function() {
            assert.strictEqual($f.removeEventListener(null), false);
        });

        test.skip('Passing in undefined returns false', function() {
            assert.strictEqual($f.removeEventListener(undefined), false);
        });

        test.skip('Passing in an empty string returns false', function() {
            assert.strictEqual($f.removeEventListener(''), false);
        });

        test.skip('Passing in an empty array returns false', function() {
            assert.strictEqual($f.removeEventListener([]), false);
        });

        test.skip('Passing in an empty object returns false', function() {
            assert.strictEqual($f.removeEventListener({}), false);
        });

        test.skip('Passing in an anonymous function returns false', function() {
            assert.strictEqual($f.removeEventListener(function() {}), false);
        });

        test.skip('Passing in a number returns false', function() {
            assert.strictEqual($f.removeEventListener(10), false);
        });

        test.skip("Passing in a string of an event that doesn't exist returns false", function() {
            assert.strictEqual($f.removeEventListener('doesnotexist'), false);
        });

        test.skip("Passing in a string of an event that does exist returns true", function() {
            $f.addEventListener('exists', function() {});

            assert.strictEqual($f.removeEventListener('exists'), true);
        });
    });

});