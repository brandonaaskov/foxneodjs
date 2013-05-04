/*global define, _, console */

define(['utils'], function (utils) {
    var packageName = '@@packageName';

    var tests = {
        utils: function () {
            QUnit.module('utils');

            QUnit.test('addPixelSuffix', 3, function () {
//                expect(3);
                QUnit.strictEqual(utils.addPixelSuffix('12'), '12px', 'Adds the "px" suffix to a string passed in with no existing "px" in it.');
                QUnit.strictEqual(utils.addPixelSuffix(12), '12px', 'Adds the "px" suffix to a number passed in.');
                QUnit.strictEqual(utils.addPixelSuffix('30px'), '30px', 'Adds the "px" suffix to a string passed in that already has a "px" suffix.');
            });

            QUnit.test('removePixelSuffix', 3, function () {
//                expect(3);
                QUnit.strictEqual(utils.removePixelSuffix('12'), '12', 'Removes the "px" suffix to a string passed in with no existing "px" in it.');
                QUnit.strictEqual(utils.removePixelSuffix(12), '12', 'Removes the "px" suffix to a number passed in.');
                QUnit.strictEqual(utils.removePixelSuffix('30px'), '30', 'Removes the "px" suffix to a string passed in that already has a "px" suffix.');
            });

            QUnit.asyncTest('dispatchEvent (no data)', 1, function () {
                var eventName = packageName + ':test';

                window.addEventListener(eventName, function () {
                    QUnit.ok(true, "Event dispatching over the window object (no data payload).");
                    window.removeEventListener(eventName);
                    QUnit.start();
                });
                utils.dispatchEvent('test');
            });

            QUnit.asyncTest('dispatchEvent (with data)', 1, function () {
                var eventName = packageName + ':test';

                window.addEventListener(packageName + ':' + eventName, function (event) {
                    QUnit.strictEqual(event.data.test, true, 'Event dispatching over the window object (with data payload).');
                    window.removeEventListener(eventName);
                    QUnit.start();
                });
                utils.dispatchEvent('test', { test: true });
            });

            QUnit.test('getColorFromString', 7, function () {
                QUnit.strictEqual(utils.getColorFromString('FF00FF'), '#ff00ff', 'Adds a hash to a color string.');
                QUnit.strictEqual(utils.getColorFromString('ff00ff'), '#ff00ff', 'Adds a hash to a color string and lowercase.');
                QUnit.strictEqual(utils.getColorFromString('#FF0000'), '#ff0000', 'Adds a hash to a color string that already is valid.');
                QUnit.strictEqual(utils.getColorFromString('#ff0000'), '#ff0000', 'Adds a hash to a color string that already is valid and lowercase.');

                var errorMessage = 'The value supplied to getColorFromString() should be a string, not whatever you passed in.';
                QUnit.throws(function () {
                    utils.getColorFromString(102345);
                }, 'Throws error on trying to pass in a number.', errorMessage);

                QUnit.throws(function () {
                    utils.getColorFromString({})
                }, 'Throws error on trying to pass in an object.', errorMessage);

                QUnit.throws(function () {
                    utils.getColorFromString([])
                }, 'Throws error on trying to pass in an array.', errorMessage);
            });
        }
    };

    var run = function () {
        tests.utils();
    };

    // Public API
    return {
        run: run
    }
});