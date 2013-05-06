/*global define, _, console */

define(['utils', 'base64'], function (utils, base64) {

    var packageName = '@@packageName';

    var tests = {
        utils: function () {
            module('utils');

            (function addPixelSuffixTests () {
                test('addPixelSuffix', 3, function () {
                    strictEqual(utils.addPixelSuffix('12'), '12px', 'Adds the "px" suffix to a string passed in with no existing "px" in it.');
                    strictEqual(utils.addPixelSuffix(12), '12px', 'Adds the "px" suffix to a number passed in.');
                    strictEqual(utils.addPixelSuffix('30px'), '30px', 'Adds the "px" suffix to a string passed in that already has a "px" suffix.');
                });

                test('removePixelSuffix', 3, function () {
                    strictEqual(utils.removePixelSuffix('12'), '12', 'Removes the "px" suffix to a string passed in with no existing "px" in it.');
                    strictEqual(utils.removePixelSuffix(12), '12', 'Removes the "px" suffix to a number passed in.');
                    strictEqual(utils.removePixelSuffix('30px'), '30', 'Removes the "px" suffix to a string passed in that already has a "px" suffix.');
                });
            })();

            (function dispatchEventTests () {
                asyncTest('dispatchEvent (no data)', 1, function () {
                    var eventName = packageName + ':test';

                    window.addEventListener(eventName, function () {
                        ok(true, "Event dispatching over the window object (no data payload).");
                        window.removeEventListener(eventName);
                        start();
                    });
                    utils.dispatchEvent('test');
                });

                asyncTest('dispatchEvent (with data)', 1, function () {
                    var eventName = packageName + ':test';

                    window.addEventListener(packageName + ':' + eventName, function (event) {
                        strictEqual(event.data.test, true, 'Event dispatching over the window object (with data payload).');
                        window.removeEventListener(eventName);
                        start();
                    });
                    utils.dispatchEvent('test', { test: true });
                });
            })();

            (function getColorFromStringTests () {
                test('getColorFromString', 7, function () {
                    strictEqual(utils.getColorFromString('FF00FF'), '#ff00ff', 'Adds a hash to a color string.');
                    strictEqual(utils.getColorFromString('ff00ff'), '#ff00ff', 'Adds a hash to a color string and lowercase.');
                    strictEqual(utils.getColorFromString('#FF0000'), '#ff0000', 'Adds a hash to a color string that already is valid.');
                    strictEqual(utils.getColorFromString('#ff0000'), '#ff0000', 'Adds a hash to a color string that already is valid and lowercase.');

                    throws(function () {
                        utils.getColorFromString(102345);
                    }, 'Throws error on trying to pass in a number.');

                    throws(function () {
                        utils.getColorFromString({})
                    }, 'Throws error on trying to pass in an object.');

                    throws(function () {
                        utils.getColorFromString([])
                    }, 'Throws error on trying to pass in an array.');
                });
            })();

            (function arrayToObjectTests () {
                test('arrayToObject', 3, function () {
                    deepEqual(utils.arrayToObject([]), {}, 'Empty array to empty object.');

                    deepEqual(utils.arrayToObject([
                        'key=value',
                        'something=else',
                        'name=brandon'
                    ]), {
                        key: 'value',
                        something: 'else',
                        name: 'brandon'
                    }, 'Array with key-value pairs to standard object.');

                    deepEqual(utils.arrayToObject([
                        'something',
                        'blah',
                        'foo'
                    ]), {
                        0: 'something',
                        1: 'blah',
                        2: 'foo'
                    }, 'Array without key-value pairs to on object with indexes as keys.');
                });
            })();

            (function objectToArrayTests () {
                test('objectToArray', 4, function () {
                    var testObject = {},
                        testArray = [];

                    deepEqual(utils.objectToArray(testObject), testArray, 'Empty object to empty array.');

                    testObj = {
                        key: 'value',
                        something: 'else',
                        name: 'brandon'
                    };

                    testArray = [
                        'key=value',
                        'something=else',
                        'name=brandon'
                    ];

                    deepEqual(utils.objectToArray(testObj), testArray, 'Object to array with key-value pairs as strings.');

                    testObj = {
                        0: 'something',
                        1: 'blah',
                        2: 'foo'
                    };

                    testArray = [
                        '0=something',
                        '1=blah',
                        '2=foo'
                    ];

                    deepEqual(utils.objectToArray(testObj), testArray, 'Array without key-value pairs to on object with indexes as keys.');

                    testObj = {
                        key: 'value',
                        something: 'else',
                        person: {
                            name: 'brandon',
                            job: 'developer',
                            language: 'javascript'
                        }
                    };

                    throws(function () {
                        utils.objectToArray(testObj);
                    }, 'Throws error on nested object.');
                });
            })();

            (function pipeStringToObjectTests () {
                test('pipeStringToObject', 2, function () {
                    var testObject = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.'
                    };

                    var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                    deepEqual(utils.pipeStringToObject(testPipeString), testObject, 'Standard, shallow object converted to pipe string.');

                    var brokenPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.|what|nothing|huh';
                    var objectFromBrokenPipeString = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.',
                        what: null,
                        nothing: null,
                        huh: null
                    };

                    deepEqual(utils.pipeStringToObject(brokenPipeString), objectFromBrokenPipeString, 'Pipe string with some values that aren\'t key-value pairs.');
                });
            })();

            (function objectToPipeStringTests () {
                test('objectToPipeString', 2, function () {
                    var testObject = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.'
                    };

                    var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                    strictEqual(utils.objectToPipeString(testObject), testPipeString, 'Key-value pair, pipe separated string converted to standard, shallow object');

                    var nestedTestObject = testObject;
                    nestedTestObject['nested'] = {
                        test: 'value'
                    };
                    throws(utils.objectToPipeString(nestedTestObject), 'Nested object throws an error.');
                });
            })();

            (function lowerCasePropertyNamesTests () {
                test('lowerCasePropertyNames', 2, function () {
                    var testObject = {
                        Name: 'Point Break',
                        Rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.',
                        camelCase: false,
                        lowerCase: true
                    };

                    var expected = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.',
                        camelcase: false,
                        lowercase: true
                    };

                    var nestedObject = _.clone(testObject);
                    nestedObject['nested'] = {
                        test: 'value'
                    };

                    deepEqual(utils.lowerCasePropertyNames(testObject), expected, 'Basic, shallow object converted property names to all lowercase.');
                    throws(utils.lowerCasePropertyNames(nestedObject), 'Nested object throws error.');
                });
            })();

            (function getQueryParamsTests () {
                test('getQueryParams', 2, function () {
                    var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                    var expected = {
                        key: 'value',
                        something: 'what',
                        testing: 'good'
                    };

                    deepEqual(utils.getQueryParams(testURL), expected, 'Typical query params (key-value pairs) converted to an object.');

                    testURL = "http://domain.com/page.html?key=value|something=what|testing=good";
                    deepEqual(utils.getQueryParams(testURL), expected, 'Typical query params separated with pipes (instead of &) converted to an object.');
                });
            })();

            (function getParamValueTest () {
            })();

            (function paramExists () {
                test('paramExists', 4, function () {
                    var testURL = "http://domain.com/page.html?myKey=value&otherKey=testValue&yetAnother=good";

                    utils.setURL(testURL);
                    strictEqual(utils.paramExists('myKey', null, testURL), true, 'Tests for a key that does exist in the query params');

                    utils.setURL(testURL);
                    strictEqual(utils.paramExists('otherKey', 'testValue', testURL), true, 'Tests for a key-value pair match');

                    utils.setURL(testURL);
                    strictEqual(utils.paramExists('otherKey', 'invalidValue', testURL), false, 'Tests for a key-value pair match that does not exist');

                    utils.setURL(testURL);
                    strictEqual(utils.paramExists('noKey', null, testURL), false, 'Tests for a key that does not exist');
                });
            })();
        },

        base64: function () {
            module('base64');

            (function jsonToBase64Tests () {
                test('jsonToBase64', 1, function () {
                    var testObject = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.',
                        camelCase: false,
                        lowerCase: true
                    };

                    var expected = 'eyJuYW1lIjoiUG9pbnQgQnJlYWsiLCJyYXRpbmciOiJSIiwiZGlyZWN0b3IiOiJLYXRocnluIEJpZ2Vsb3ciLCJzdW1tYXJ5IjoiQXdlc29tZS4iLCJjYW1lbENhc2UiOmZhbHNlLCJsb3dlckNhc2UiOnRydWV9';

                    strictEqual(base64.jsonToBase64(testObject), expected, 'Basic, shallow object converted to JSON and then base64 properly.');
                });
            })();

            (function base64ToJSON () {
                test('base64ToJSON', 1, function () {
                    var expected = {
                        name: 'Point Break',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Awesome.',
                        camelCase: false,
                        lowerCase: true
                    };

                    var base64String = 'eyJuYW1lIjoiUG9pbnQgQnJlYWsiLCJyYXRpbmciOiJSIiwiZGlyZWN0b3IiOiJLYXRocnluIEJpZ2Vsb3ciLCJzdW1tYXJ5IjoiQXdlc29tZS4iLCJjYW1lbENhc2UiOmZhbHNlLCJsb3dlckNhc2UiOnRydWV9';

                    deepEqual(base64.base64ToJSON(base64String), expected, 'Base 64 string decoded to a shallow, basic object properly.');
                });
            })();
        }
    };

    var run = function () {
        tests.utils();
        tests.base64();
    };

    // Public API
    return {
        run: run
    }
});