/*global define, $, _, console */

define(['utils', 'base64', 'player', 'debug'], function (utils, base64, player, Debug) {

    var packageName = '@@packageName';

    var tests = {
        utils: function () {
            module('utils');

            (function addPixelSuffixTests () {
                test('addPixelSuffix', function () {
                    strictEqual(utils.addPixelSuffix('12'), '12px', 'Adds the "px" suffix to a string passed in with no existing "px" in it.');
                    strictEqual(utils.addPixelSuffix(12), '12px', 'Adds the "px" suffix to a number passed in.');
                    strictEqual(utils.addPixelSuffix('30px'), '30px', 'Adds the "px" suffix to a string passed in that already has a "px" suffix.');
                });

                test('removePixelSuffix', function () {
                    strictEqual(utils.removePixelSuffix('12'), '12', 'Removes the "px" suffix to a string passed in with no existing "px" in it.');
                    strictEqual(utils.removePixelSuffix(12), '12', 'Removes the "px" suffix to a number passed in.');
                    strictEqual(utils.removePixelSuffix('30px'), '30', 'Removes the "px" suffix to a string passed in that already has a "px" suffix.');
                });
            })();

            test('dispatchEvent', 3, function () {
                stop(2);
                var eventName = packageName + ':test';

                window.addEventListener(eventName, function () {
                    window.removeEventListener(eventName);
                    ok(true, "Event dispatching over the window object (no data payload).");

                    console.log('ran one assert and removed the event listener for ' + eventName);
                    start();
                });
                utils.dispatchEvent('test');

                eventName = packageName + ':dataTest';

                window.addEventListener(eventName, function (event) {
                    window.removeEventListener(eventName);
                    strictEqual(event.data.movie, 'Django', 'Event dispatching over the window object (with data payload)');
                    strictEqual(_.isObject(event.data), true, 'Data payload object is in fact, an Object');

                    console.log('ran two asserts and removed the event listener for ' + eventName);
                    start();
                });
                utils.dispatchEvent('dataTest', { movie: 'Django' });
            });

            (function getColorFromStringTests () {
                test('getColorFromString', function () {
                    strictEqual(_.isString(utils.getColorFromString('FFFFFF')), true, 'Returns a string');
                    strictEqual(utils.getColorFromString('FF00FF'), '#ff00ff', 'Adds a hash to a color string');
                    strictEqual(utils.getColorFromString('ff00ff'), '#ff00ff', 'Adds a hash to a color string and lowercase');
                    strictEqual(utils.getColorFromString('#FF0000'), '#ff0000', 'Adds a hash to a color string that already is valid');
                    strictEqual(utils.getColorFromString('#ff0000'), '#ff0000', 'Adds a hash to a color string that already is valid and lowercase');

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
                test('arrayToObject', function () {
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
                test('objectToArray', function () {
                    var testObject = {},
                        testArray = [];

                    deepEqual(utils.objectToArray(testObject), testArray, 'Empty object to empty array.');

                    testObject = {
                        key: 'value',
                        something: 'else',
                        name: 'brandon'
                    };

                    testArray = [
                        'key=value',
                        'something=else',
                        'name=brandon'
                    ];

                    deepEqual(utils.objectToArray(testObject), testArray, 'Object to array with key-value pairs as strings.');

                    testObject = {
                        0: 'something',
                        1: 'blah',
                        2: 'foo'
                    };

                    testArray = [
                        '0=something',
                        '1=blah',
                        '2=foo'
                    ];

                    deepEqual(utils.objectToArray(testObject), testArray, 'Array without key-value pairs to on object with indexes as keys.');

                    testObject = {
                        key: 'value',
                        something: 'else',
                        person: {
                            name: 'brandon',
                            job: 'developer',
                            language: 'javascript'
                        }
                    };

                    throws(function () {
                        utils.objectToArray(testObject);
                    }, 'Throws error on nested object.');
                });
            })();

            (function getKeyFromValueTests () {
                test('getKeyFromValue', function () {
                    var testObject = {
                        name: 'The Hurt Locker',
                        rating: 'R',
                        director: 'Kathryn Bigelow',
                        summary: 'Badass.',
                        score: 93.7491
                    };

                    strictEqual(utils.getKeyFromValue(testObject, 'R'), 'rating', 'Retrieved the key based on the value from a basic object');
                    strictEqual(utils.getKeyFromValue(testObject, 93.7491), 'score', 'Retrieved the key based on the floating point value from a basic object');
                    equal(utils.getKeyFromValue(testObject, '93.7491'), 'score', 'Retrieved the key based on the string value of a floating point number from a basic object');
                    strictEqual(utils.getKeyFromValue(testObject, 'nonexistent'), '', 'Got an empty string when looking for a value that did not exist in the provided object');
                    strictEqual(utils.getKeyFromValue(testObject, 0), '', 'Got an empty string when looking for the value 0 which does not exist in the provided object');

                    testObject.nested = {
                        extra: 'stuff'
                    };
                    strictEqual(utils.getKeyFromValue(testObject, 'stuff'), '', 'Got an empty string when looking for a value that was too deep in the provided object');
                })
            })();

            (function pipeStringToObjectTests () {
                test('pipeStringToObject', function () {
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
                test('objectToPipeString', function () {
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
                test('lowerCasePropertyNames', function () {
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
                test('getQueryParams', function () {
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

            (function getParamValueTests () {
                test('getParamValue', function () {
                    var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";

                    utils.setURL(testURL);
                    strictEqual(utils.getParamValue('something'), 'what', 'Grabbed the param value from a query string on a url');
                });
            })();

            (function paramExists () {
                test('paramExists', function () {
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

            (function setURLTests () {
                test('setURL', function () {
                    var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                    var expected = {
                        key: 'value',
                        something: 'what',
                        testing: 'good'
                    };

                    strictEqual(utils.setURL('test'), utils.getURL(), 'setURL works on a non-URI string');
                    strictEqual(utils.setURL(testURL), testURL, 'setURL works on a typical URI string');

                    utils.setURL(testURL);
                    deepEqual(utils.getQueryParams(), expected, 'setURL works for other methods that do not explicitly pass the URL');
                });
            })();
        },

        base64: function () {
            module('base64');

            (function jsonToBase64Tests () {
                test('jsonToBase64', function () {
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
                test('base64ToJSON', function () {
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
        },

        player: {
            iframe: function () {
                module('player:iframe', {
                    setup: function () {
                        $('#player').append('<div id="playerID" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true|siteSection=myFWSiteSection"></div>');
                    },
                    teardown: function () {
                        $('#player').empty();
                        $('#players').empty();
                    }
                });

                (function getPlayerAttributesTests () {

                    test('getPlayerAttributes', function () {
                        $('#player').append('<div id="playerID" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true|siteSection=myFWSiteSection"></div>');

                        var element = document.querySelector('#playerID');
                        var expected = {
                            autoplay: 'true',
                            width: '640',
                            height: '360',
                            iframeHeight: '360',
                            iframeWidth: '640',
                            fb: 'true',
                            releaseURL: 'http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true',
                            siteSection: 'myFWSiteSection'
                        };

                        strictEqual(_.isObject(player._test.getPlayerAttributes(element)), true, 'getPlayerAttributes returned an object');
                        deepEqual(player._test.getPlayerAttributes(element), expected, "The object returned as expected");

                        throws(function () {
                            player._test.getPlayerAttributes($('#playerID'));
                        }, 'getPlayerAttributes throws error on trying to use jQuery object');

                        // add multiple players
                        $('#players')
                            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
                            .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
                            .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
                            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
                            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');

                        throws(function () {
                            player._test.getPlayerAttributes(document.querySelectorAll('.player'));
                        }, "Throws an error when we pass an array of elements");
                    });
                })();
            }
        },

        Debug: function () {
            module('Debug');

            (function () {
                test('log', 4, function () {
                    throws(function () {
                        new Debug();
                    }, 'Not passing in a category string fires an error');

                    throws(function () {
                        new Debug('');
                    }, 'Passing in an empty category string fires an error');

                    throws(function () {
                        new Debug('x');
                    }, 'Passing in a single letter string fires an error');

                    throws(function () {
                        new Debug('xy');
                    }, 'Passing in a two letter string fires an error');

                    //TODO: test more once PhantomJS is here
                });

                /*
                 debug.log('testing a basic log');
                 debug.log('testing a log with data', { name: 'brandon'});
                 debug.warn('testing a warning');

                 var diff = new Debug('diff');
                 diff.log('testing a basic log with diff');
                 diff.log('testing a log with data with diff', { name: 'brandon'});
                 diff.warn('testing a warning with diff');
                 diff.error('testing an error with diff');

                 var yep = new Debug('yep');
                 yep.log('testing a basic log with yep');
                 */
            })();
        }
    };

    var run = function () {
        tests.utils();
        tests.base64();
        tests.player.iframe();
        tests.Debug();
    };

    // Public API
    return {
        run: run
    }
});