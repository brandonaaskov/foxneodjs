/*global require */

require.config({
    baseUrl: '../../js/',
    paths: {
        almond: 'lib/almond/almond'
        , jquery: 'lib/jquery/jquery-2.0.0.min'
        , underscore: 'lib/underscore/underscore'
        , modernizr: 'lib/modernizr/modernizr.custom'
        , mocha: '../node_modules/mocha/mocha'
        , chai: '../node_modules/chai/chai'
    }
});

require(['require', 'chai', 'utils', 'base64', 'player', 'debug', 'mocha', 'underscore', 'jquery'], function (require, chai, utils, base64, player, Debug) {
    'use strict';

    mocha.setup('tdd');

    var assert = chai.assert,
        expect = chai.expect,
        should = chai.should;

    suite('FoxNEOD', function () {

        //------------------------------------------------------------------------------------- utils
        suite('utils', function () {
            test('addPixelSuffix', function () {
                assert.strictEqual(utils.addPixelSuffix('12'), '12px', 'Adds the "px" suffix to a string passed in with no existing "px" in it.');
                assert.strictEqual(utils.addPixelSuffix(12), '12px', 'Adds the "px" suffix to a number passed in.');
                assert.strictEqual(utils.addPixelSuffix('30px'), '30px', 'Adds the "px" suffix to a string passed in that already has a "px" suffix.');
            });

            test('removePixelSuffix', function () {
                assert.strictEqual(utils.removePixelSuffix('12'), '12', 'Removes the "px" suffix to a string passed in with no existing "px" in it.');
                assert.strictEqual(utils.removePixelSuffix(12), '12', 'Removes the "px" suffix to a number passed in.');
                assert.strictEqual(utils.removePixelSuffix('30px'), '30', 'Removes the "px" suffix to a string passed in that already has a "px" suffix.');
            });

            test('dispatchEvent', 3, function () {
                assert.stop(2);
                var eventName = packageName + ':test';

                window.addEventListener(eventName, function () {
                    window.removeEventListener(eventName);
                    assert.ok(true, "Event dispatching over the window object (no data payload).");

                    console.log('ran one assert and removed the event listener for ' + eventName);
                    assert.start();
                });
                utils.dispatchEvent('test');

                eventName = packageName + ':dataTest';

                window.addEventListener(eventName, function (event) {
                    window.removeEventListener(eventName);
                    assert.strictEqual(event.data.movie, 'Django', 'Event dispatching over the window object (with data payload)');
                    assert.strictEqual(_.isObject(event.data), true, 'Data payload object is in fact, an Object');

                    console.log('ran two asserts and removed the event listener for ' + eventName);
                    assert.start();
                });
                utils.dispatchEvent('dataTest', { movie: 'Django' });
            });

            test('getColorFromString', function () {
                assert.strictEqual(_.isString(utils.getColorFromString('FFFFFF')), true, 'Returns a string');
                assert.strictEqual(utils.getColorFromString('FF00FF'), '#ff00ff', 'Adds a hash to a color string');
                assert.strictEqual(utils.getColorFromString('ff00ff'), '#ff00ff', 'Adds a hash to a color string and lowercase');
                assert.strictEqual(utils.getColorFromString('#FF0000'), '#ff0000', 'Adds a hash to a color string that already is valid');
                assert.strictEqual(utils.getColorFromString('#ff0000'), '#ff0000', 'Adds a hash to a color string that already is valid and lowercase');

                assert.throws(function () {
                    utils.getColorFromString(102345);
                }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');

                assert.throws(function () {
                    utils.getColorFromString({})
                }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');

                assert.throws(function () {
                    utils.getColorFromString([])
                }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');
            });


            test('arrayToObject', function () {
                assert.deepEqual(utils.arrayToObject([]), {}, 'Empty array to empty object.');

                assert.deepEqual(utils.arrayToObject([
                    'key=value',
                    'something=else',
                    'name=brandon'
                ]), {
                    key: 'value',
                    something: 'else',
                    name: 'brandon'
                }, 'Array with key-value pairs to standard object.');

                assert.deepEqual(utils.arrayToObject([
                    'something',
                    'blah',
                    'foo'
                ]), {
                    0: 'something',
                    1: 'blah',
                    2: 'foo'
                }, 'Array without key-value pairs to on object with indexes as keys.');
            });

            test('objectToArray', function () {
                var testObject = {},
                    testArray = [];

                assert.deepEqual(utils.objectToArray(testObject), testArray, 'Empty object to empty array.');

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

                assert.deepEqual(utils.objectToArray(testObject), testArray, 'Object to array with key-value pairs as strings.');

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

                assert.deepEqual(utils.objectToArray(testObject), testArray, 'Array without key-value pairs to on object with indexes as keys.');

                testObject = {
                    key: 'value',
                    something: 'else',
                    person: {
                        name: 'brandon',
                        job: 'developer',
                        language: 'javascript'
                    }
                };

                assert.throws(function () {
                    utils.objectToArray(testObject);
                }, 'objectToArray only supports shallow objects (no nested objects or arrays).');
            });

            test('getKeyFromValue', function () {
                var testObject = {
                    name: 'The Hurt Locker',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Badass.',
                    score: 93.7491
                };

                assert.strictEqual(utils.getKeyFromValue(testObject, 'R'), 'rating', 'Retrieved the key based on the value from a basic object');
                assert.strictEqual(utils.getKeyFromValue(testObject, 93.7491), 'score', 'Retrieved the key based on the floating point value from a basic object');
                assert.equal(utils.getKeyFromValue(testObject, '93.7491'), 'score', 'Retrieved the key based on the string value of a floating point number from a basic object');
                assert.strictEqual(utils.getKeyFromValue(testObject, 'nonexistent'), '', 'Got an empty string when looking for a value that did not exist in the provided object');
                assert.strictEqual(utils.getKeyFromValue(testObject, 0), '', 'Got an empty string when looking for the value 0 which does not exist in the provided object');

                testObject.nested = {
                    extra: 'stuff'
                };
                assert.strictEqual(utils.getKeyFromValue(testObject, 'stuff'), '', 'Got an empty string when looking for a value that was too deep in the provided object');
            })

            test('pipeStringToObject', function () {
                var testObject = {
                    name: 'Point Break',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Awesome.'
                };

                var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                assert.deepEqual(utils.pipeStringToObject(testPipeString), testObject, 'Standard, shallow object converted to pipe string.');

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

                assert.deepEqual(utils.pipeStringToObject(brokenPipeString), objectFromBrokenPipeString, 'Pipe string with some values that aren\'t key-value pairs.');
            });

            test('objectToPipeString', function () {
                var testObject = {
                    name: 'Point Break',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Awesome.'
                };

                var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                assert.strictEqual(utils.objectToPipeString(testObject), testPipeString, 'Key-value pair, pipe separated string converted to standard, shallow object');

                var nestedTestObject = testObject;
                nestedTestObject['nested'] = {
                    test: 'value'
                };
                assert.throws(utils.objectToPipeString(nestedTestObject), 'Nested object throws an error.');
            });

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

                assert.deepEqual(utils.lowerCasePropertyNames(testObject), expected, 'Basic, shallow object converted property names to all lowercase.');
                assert.throws(utils.lowerCasePropertyNames(nestedObject), 'Nested object throws error.');
            });

            test('getQueryParams', function () {
                var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                var expected = {
                    key: 'value',
                    something: 'what',
                    testing: 'good'
                };

                assert.deepEqual(utils.getQueryParams(testURL), expected, 'Typical query params (key-value pairs) converted to an object.');

                testURL = "http://domain.com/page.html?key=value|something=what|testing=good";
                assert.deepEqual(utils.getQueryParams(testURL), expected, 'Typical query params separated with pipes (instead of &) converted to an object.');
            });

            test('getParamValue', function () {
                var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";

                utils.setURL(testURL);
                assert.strictEqual(utils.getParamValue('something'), 'what', 'Grabbed the param value from a query string on a url');
            });

            test('paramExists', function () {
                var testURL = "http://domain.com/page.html?myKey=value&otherKey=testValue&yetAnother=good";

                utils.setURL(testURL);
                assert.strictEqual(utils.paramExists('myKey', null, testURL), true, 'Tests for a key that does exist in the query params');

                utils.setURL(testURL);
                assert.strictEqual(utils.paramExists('otherKey', 'testValue', testURL), true, 'Tests for a key-value pair match');

                utils.setURL(testURL);
                assert.strictEqual(utils.paramExists('otherKey', 'invalidValue', testURL), false, 'Tests for a key-value pair match that does not exist');

                utils.setURL(testURL);
                assert.strictEqual(utils.paramExists('noKey', null, testURL), false, 'Tests for a key that does not exist');
            });

            test('setURL', function () {
                var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                var expected = {
                    key: 'value',
                    something: 'what',
                    testing: 'good'
                };

                assert.strictEqual(utils.setURL('test'), utils.getURL(), 'setURL works on a non-URI string');
                assert.strictEqual(utils.setURL(testURL), testURL, 'setURL works on a typical URI string');

                utils.setURL(testURL);
                assert.deepEqual(utils.getQueryParams(), expected, 'setURL works for other methods that do not explicitly pass the URL');
            });
        });
        //------------------------------------------------------------------------------------- /utils



        //------------------------------------------------------------------------------------- base64
        suite('base64', function () {
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

                assert.strictEqual(base64.jsonToBase64(testObject), expected, 'Basic, shallow object converted to JSON and then base64 properly.');
            });

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

                assert.deepEqual(base64.base64ToJSON(base64String), expected, 'Base 64 string decoded to a shallow, basic object properly.');
            });
        });
        //------------------------------------------------------------------------------------- /base64



        //------------------------------------------------------------------------------------- player
        suite('player', function () {
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

                var error = "What you passed to getPlayerAttributes() wasn't an element. It was likely something " +
                    "like a jQuery object, but try using document.querySelector() or document.querySelectorAll() to get " +
                    "the element that you need. We try to not to depend on jQuery where we don't have to";

                assert.strictEqual(_.isObject(player._test.getPlayerAttributes(element)), true, 'getPlayerAttributes returned an object');
                assert.deepEqual(player._test.getPlayerAttributes(element), expected, "The object returned as expected");

                assert.throws(function () {
                    player._test.getPlayerAttributes($('#playerID'));
                }, error);

                // add multiple players
                $('#players')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');

                assert.throws(function () {
                    player._test.getPlayerAttributes(document.querySelectorAll('.player'));
                }, error);

                assert.throws(function () {
                    player.seekTo(3);
                }, "The OVP object was undefined.");

                //sets up dummy pdk object for testing
                window.$pdk = {
                    controller: {
                        seekTo: function () {},
                        seek: function () {}
                    }
                }
                assert.strictEqual(player.seekTo(3), true, "Seeks to 3 seconds properly (assumes PDK existence).");
                assert.strictEqual(player.seekTo(0), true, "Seeks to 0 seconds properly (assumes PDK existence).");
                assert.throws(function () {
                    player.seekTo();
                }, "The value supplied was not a valid number.");
                assert.strictEqual(player.seekTo("10"), true, "Seeks to position provided as string.");
                assert.strictEqual(player.seekTo(40.5), true, "Seeks to floating point number.");
                assert.strictEqual(player.seekTo("12.384734"), true, "Seeks to floating point number as a string");
                assert.strictEqual(player.seekTo(-2), false, "Returns false (and does nothing) with a negative number.");
                assert.strictEqual(player.seekTo("-30"), false, "Returns false (and does nothing) with a negative number as a string.");
                assert.strictEqual(player.seekTo(100.55234582394572328345723048957), true, "Seeks properly to ");
                assert.strictEqual(player.seekTo(1000000000000), false, "Seeks to value longer than the video.");
            });
        });
        //------------------------------------------------------------------------------------- /player




        //------------------------------------------------------------------------------------- Debug
        suite('Debug', function () {
            test('log', function () {

                assert.throws(function () {
                    new Debug();
                }, "You didn't supply a category string when you instantiated a Debug instance. That's required. Sorry kiddo!");

                assert.throws(function () {
                    new Debug('');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");

                assert.throws(function () {
                    new Debug('x');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");

                assert.throws(function () {
                    new Debug('xy');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");

                assert.throws(function () {
                    new Debug({});
                }, "When instantiating the Debug class, it expects a string for the category name as the " +
                    "only argument.");

                //TODO: test more once PhantomJS is here
            });
        });
        //------------------------------------------------------------------------------------- /Debug
    });

    mocha.run();
});