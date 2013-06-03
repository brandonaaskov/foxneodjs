(function () {
    'use strict';

    var assert = chai.assert,
        expect = chai.expect,
        should = chai.should;

    suite('foxneod', function () {

        //------------------------------------------------------------------------------------- utils
        suite('utils', function () {

            suite('arrayToObject()', function () {
                test('Empty array to empty object', function () {
                    assert.deepEqual(_.arrayToObject([]), {});
                });

                test('Array with key-value pairs to standard object', function () {
                    assert.deepEqual(_.arrayToObject([
                        'key=value',
                        'something=else',
                        'name=brandon'
                    ]), {
                        key: 'value',
                        something: 'else',
                        name: 'brandon'
                    });
                });

                test('Array without key-value pairs to on object with indexes as keys', function () {
                    assert.deepEqual(_.arrayToObject([
                        'something',
                        'blah',
                        'foo'
                    ]), {
                        0: 'something',
                        1: 'blah',
                        2: 'foo'
                    });
                });
            });

            suite('objectToArray()', function () {
                var testObject = {},
                    testArray = [];

                test('Empty object to empty array', function () {
                    assert.deepEqual(_.objectToArray(testObject), testArray);
                });

                test('Object to array with key-value pairs as strings', function () {
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

                    assert.deepEqual(_.objectToArray(testObject), testArray);
                });

                test('Array without key-value pairs to on object with indexes as keys', function () {
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

                    assert.deepEqual(_.objectToArray(testObject), testArray);
                });

                test('Throws an error when receiving a nested object', function () {
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
                        _.objectToArray(testObject);
                    }, 'The value you supplied to objectToArray() was not a basic (numbers and strings) shallow object');
                });
            });

            suite('booleanToString()', function () {});

            suite('stringToBoolean()', function () {});

            suite('isDefined()', function () {});

            suite('isLooseEqual()', function () {});

            suite('isShallowObject()', function () {});

            suite('isTrueObject()', function () {});

            suite('getKeyFromValue()', function () {
                var testObject = {
                    name: 'The Hurt Locker',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Badass.',
                    score: 93.7491
                };

                test('Retrieved the key based on the value from a basic object', function () {
                    assert.strictEqual(_.getKeyFromValue(testObject, 'R'), 'rating');
                });

                test('Retrieved the key based on the floating point value from a basic object', function () {
                    assert.strictEqual(_.getKeyFromValue(testObject, 93.7491), 'score');
                });

                test('Retrieved the key based on the string value of a floating point number from a basic object', function () {
                    assert.equal(_.getKeyFromValue(testObject, '93.7491'), 'score');
                });

                test('Got an empty string when looking for the value 0 which does not exist in the provided object', function () {
                    assert.strictEqual(_.getKeyFromValue(testObject, 0), '');
                });

                test('Got an empty string when looking for a value that did not exist in the provided object', function () {
                    assert.strictEqual(_.getKeyFromValue(testObject, 'nonexistent'), '');
                });

                test('Got an empty string when looking for a value that was too deep in the provided object', function () {
                    testObject.nested = {
                        extra: 'stuff'
                    };
                    assert.strictEqual(_.getKeyFromValue(testObject, 'stuff'), '');
                });
            });

            suite('objectToPipeString()', function () {
                var testObject = {
                    name: 'Point Break',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Awesome.'
                };

                var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                test('Key-value pair, pipe separated string converted to standard, shallow object', function () {
                    assert.strictEqual(_.objectToPipeString(testObject), testPipeString);
                });

                test('Throws an error on getting a nested object', function () {
                    var nestedTestObject = testObject;
                    nestedTestObject['nested'] = {
                        test: 'value'
                    };

                    var errorMessage = "The first argument you supplied to objectToPipeString() was not a valid object. " +
                        "The objectToPipeString() method only supports a shallow object of strings and numbers.";
                    assert.throws(function () {
                        _.objectToPipeString(nestedTestObject);
                    }, errorMessage);
                });
            });

            suite('pipeStringToObject()', function () {
                var testObject = {
                    name: 'Point Break',
                    rating: 'R',
                    director: 'Kathryn Bigelow',
                    summary: 'Awesome.'
                };

                var testPipeString = 'name=Point Break|rating=R|director=Kathryn Bigelow|summary=Awesome.';

                test('Standard, shallow object converted to pipe string', function () {
                    assert.deepEqual(_.pipeStringToObject(testPipeString), testObject);
                });

                test("Pipe string with some values that aren't key-value pairs.", function () {
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

                    assert.deepEqual(_.pipeStringToObject(brokenPipeString), objectFromBrokenPipeString);
                });
            });

            suite('lowerCasePropertyNames()', function () {
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

                test('Basic, shallow object converted property names to all lowercase', function () {
                    assert.deepEqual(_.lowerCasePropertyNames(testObject), expected);
                });

                test('Nested object converts properly', function () {
                    var nestedObject = _.clone(testObject);
                    nestedObject['nested'] = {
                        test: 'value',
                        CAPITAL: 'BUILDING',
                        doubleNest: {
                            cRaZy: 'nester'
                        }
                    };

                    var nestedExpected = _.clone(expected);
                    nestedExpected['nested'] = {
                        test: 'value',
                        capital: 'BUILDING',
                        doublenest: {
                            crazy: 'nester'
                        }
                    }

                    assert.deepEqual(_.lowerCasePropertyNames(nestedObject), nestedExpected);
                });
            });

            suite('getColorFromString()', function () {
                test('Returns a string', function () {
                    assert.strictEqual(_.isString(_.getColorFromString('FFFFFF')), true);
                });

                test('Adds a hash to a color string', function () {
                    assert.strictEqual(_.getColorFromString('ff00ff'), '#ff00ff');
                });
                test('Adds a hash to a color string and lowercase', function () {
                    assert.strictEqual(_.getColorFromString('FF00FF'), '#ff00ff');
                });

                test('Adds a hash to a color string that already is valid', function () {
                    assert.strictEqual(_.getColorFromString('#FF0000'), '#ff0000');
                });

                test('Adds a hash to a color string that already is valid and lowercase', function () {
                    assert.strictEqual(_.getColorFromString('#ff0000'), '#ff0000');
                });

                test('Throws an error when supplied argument is a number', function () {
                    assert.throws(function () {
                        _.getColorFromString(102345);
                    }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');
                });

                test('Throws an error when supplied argument is an object', function () {
                    assert.throws(function () {
                        _.getColorFromString({})
                    }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');
                });

                test('Throws an error when supplied argument is an array', function () {
                    assert.throws(function () {
                        _.getColorFromString([])
                    }, 'The value supplied to getColorFromString() should be a string, not whatever you passed in.');
                });
            });

            suite('addPixelSuffix()', function () {
                test('Adds the "px" suffix to a string passed in with no existing "px" in it', function () {
                    assert.strictEqual(_.addPixelSuffix('12'), '12px');
                });

                test('Adds the "px" suffix to a number passed in', function () {
                    assert.strictEqual(_.addPixelSuffix(12), '12px');
                });

                test('Adds the "px" suffix to a string passed in that already has a "px" suffix', function () {
                    assert.strictEqual(_.addPixelSuffix('30px'), '30px');
                });
            });

            suite('removePixelSuffix()', function () {
                test('Removes the "px" suffix to a string passed in with no existing "px" in it', function () {
                    assert.strictEqual(_.removePixelSuffix('12'), '12');
                });

                test('Removes the "px" suffix to a number passed in', function () {
                    assert.strictEqual(_.removePixelSuffix(12), '12');
                });

                test('Removes the "px" suffix to a string passed in that already has a "px" suffix', function () {
                    assert.strictEqual(_.removePixelSuffix('30px'), '30');
                });
            });

//            suite('dispatchEvent()', function () {
//                //FILL ME WITH GREAT THINGS
//            });
//            test('dispatchEvent', 3, function () {
//                assert.stop(2);
//                var eventName = packageName + ':test';
//
//                window.addEventListener(eventName, function () {
//                    window.removeEventListener(eventName);
//                    assert.ok(true, "Event dispatching over the window object (no data payload).");
//
//                    console.log('ran one assert and removed the event listener for ' + eventName);
//                    assert.start();
//                });
//                _.dispatchEvent('test');
//
//                eventName = packageName + ':dataTest';
//
//                window.addEventListener(eventName, function (event) {
//                    window.removeEventListener(eventName);
//                    assert.strictEqual(event.data.movie, 'Django', 'Event dispatching over the window object (with data payload)');
//                    assert.strictEqual(_.isObject(event.data), true, 'Data payload object is in fact, an Object');
//
//                    console.log('ran two asserts and removed the event listener for ' + eventName);
//                    assert.start();
//                });
//                _.dispatchEvent('dataTest', { movie: 'Django' });
//            });

            suite('getQueryParams()', function () {
                var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                var expected = {
                    key: 'value',
                    something: 'what',
                    testing: 'good'
                };

                test('Typical query params (key-value pairs) converted to an object', function () {
                    assert.deepEqual(_.getQueryParams(testURL), expected);
                });

                test('Typical query params separated with pipes (instead of &) converted to an object', function () {
                    testURL = "http://domain.com/page.html?key=value|something=what|testing=good";
                    assert.deepEqual(_.getQueryParams(testURL), expected);
                });
            });

            suite('getParamValue()', function () {
                test('Grabbed the param value from a query string on a url', function () {
                    var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";

                    $f.utils.setURL(testURL);
                    assert.strictEqual(_.getParamValue('something'), 'what');
                });
            });

            suite('paramExists()', function () {
                var testURL = "http://domain.com/page.html?myKey=value&otherKey=testValue&yetAnother=good";

                test('Tests for a key that does exist in the query params', function () {
                    $f.utils.setURL(testURL);
                    assert.strictEqual(_.paramExists('myKey', null, testURL), true);
                });

                test('Tests for a key-value pair match', function () {
                    $f.utils.setURL(testURL);
                    assert.strictEqual(_.paramExists('otherKey', 'testValue', testURL), true);
                });

                test('Tests for a key-value pair match that does not exist', function () {
                    $f.utils.setURL(testURL);
                    assert.strictEqual(_.paramExists('otherKey', 'invalidValue', testURL), false);
                });

                test('Tests for a key that does not exist', function () {
                    $f.utils.setURL(testURL);
                    assert.strictEqual(_.paramExists('noKey', null, testURL), false);
                });
            });

            suite('setURL()', function () {
                var testURL = "http://domain.com/page.html?key=value&something=what&testing=good";
                var expected = {
                    key: 'value',
                    something: 'what',
                    testing: 'good'
                };

                test('works on a non-URI string', function () {
                    assert.strictEqual($f.utils.setURL('test'), $f.utils.getURL());
                });

                test('works on a typical URI string', function () {
                    assert.strictEqual($f.utils.setURL(testURL), testURL);
                });

                test('setURL works for other methods that do not explicitly pass the URL', function () {
                    $f.utils.setURL(testURL);
                    assert.deepEqual(_.getQueryParams(), expected);
                });
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

                assert.strictEqual($f.__test__.base64.jsonToBase64(testObject), expected, 'Basic, shallow object converted to JSON and then base64 properly.');
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

                assert.deepEqual($f.__test__.base64.base64ToJSON(base64String), expected, 'Base 64 string decoded to a shallow, basic object properly.');
            });
        });
        //------------------------------------------------------------------------------------- /base64



        //------------------------------------------------------------------------------------- player
        suite('player', function () {

            suite('getPlayerAttributes', function () {
                jQuery('#player').append('<div id="playerID" data-player="autoplay=true|width=640|height=360|fb=true' +
                    '|releaseURL=http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true' +
                    '|siteSection=myFWSiteSection"></div>');

                var element = document.querySelector('#playerID');
                var expected = {
                    autoplay: 'true',
                    width: '640',
                    height: '360',
                    iframeHeight: '360', //gets added by getPlayerAttributes if not already provided
                    iframeWidth: '640', //gets added by getPlayerAttributes if not already provided
                    fb: 'true',
                    releaseURL: 'http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true',
                    siteSection: 'myFWSiteSection'
                };

                var noElementError = "What you passed to getPlayerAttributes() wasn't an element. It was likely something " +
                    "like a jQuery object, but try using document.querySelector() or document.querySelectorAll() to get " +
                    "the element that you need. We try to not to depend on jQuery where we don't have to.";

                test('converts data-player attributes pipe-separated kv pairs and adds iframeheight and iframewidth', function () {
                    var elementAttributes = $f.player.__test__.getPlayerAttributes(element);
                    assert.deepEqual(elementAttributes, expected, 'getPlayerAttributes returned an object');
                });

                test('throws error when anything besides an HTML element is supplied', function () {
                    assert.throws(function () {
                        $f.player.__test__.getPlayerAttributes(jQuery('#playerID'));
                    }, noElementError);
                });

                test('Throws an error when an array of elements is supplied', function () {
                    // add multiple players
                    jQuery('#players')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');

                    assert.throws(function () {
                        $f.player.__test__.getPlayerAttributes(document.querySelectorAll('.player'));
                    }, noElementError);
                });
            });

//            suite('seekTo', function () {
//                test('Tries to seek before the OVP controller was available', function () {
//                    assert.throws(function () {
//                        $f.player.seekTo(3);
//                    }, "The expected controller doesn't exist or wasn't available at the time this was called.");
//                });
//
//                //sets up dummy pdk object for testing
//                window.$pdk = {
//                    controller: {
//                        seekTo: function () {},
//                        seek: function () {}
//                    }
//                }
//
//                test('Seeks to 3 seconds properly (assumes PDK existence)', function () {
//                    assert.strictEqual($f.player.seekTo(3), true);
//                });
//
//                test('Seeks to 0 seconds properly (assumes PDK existence)', function () {
//                    assert.strictEqual($f.player.seekTo(0), true);
//                });
//
//                test("Throws error when value supplied isn't a number", function () {
//                    assert.throws(function () {
//                        $f.player.seekTo();
//                    }, "The value supplied was not a valid number.");
//                });
//
//                test('Seeks to position provided as string', function () {
//                    assert.strictEqual($f.player.seekTo("10"), true);
//                });
//
//                test('Seeks to floating point number', function () {
//                    assert.strictEqual($f.player.seekTo(40.5), true);
//                });
//
//                test('Seeks to floating point number as a string', function () {
//                    assert.strictEqual($f.player.seekTo("12.384734"), true);
//                });
//
//                test('Returns false (and does nothing) with a negative number', function () {
//                    assert.strictEqual($f.player.seekTo(-2), false);
//                });
//
//                test('Returns false (and does nothing) with a negative number as a string', function () {
//                    assert.strictEqual($f.player.seekTo("-30"), false);
//                });
//
//                test('Seeks properly to a supplied time with many, many decimal places', function () {
//                    assert.strictEqual($f.player.seekTo(100.55234582394572328345723048957), true);
//                });
//
//                test("Seeks to a value longer than the video's length", function () {
//                    assert.strictEqual($f.player.seekTo(1000000000000), false);
//                });
//            });
        });
        //------------------------------------------------------------------------------------- /player



        //------------------------------------------------------------------------------------- Debug
        suite('Debug', function () {

            test('Throws an error when no category string was supplied to the constructor', function () {
                assert.throws(function () {
                    new $f.Debug();
                }, "You didn't supply a category string when you instantiated a Debug instance. That's required. Sorry kiddo!");
            });

            test('Throws an error when the supplied category is an empty string', function () {
                assert.throws(function () {
                    new $f.Debug('');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");
            });

            test('Throws an error when the supplied category string is one character long', function () {
                assert.throws(function () {
                    new $f.Debug('x');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");
            });

            test('Throws an error when the supplied category string is 2 characters long', function () {
                assert.throws(function () {
                    new $f.Debug('xy');
                }, "Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");
            });

            test('Throws an error when the supplied argument to the constructor is an empty object', function () {
                assert.throws(function () {
                    new $f.Debug({});
                }, "When instantiating the Debug class, it expects a string for the category name as the " +
                    "only argument.");
            });
        });
        //------------------------------------------------------------------------------------- /Debug
    });
})();