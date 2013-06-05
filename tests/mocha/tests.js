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

            suite('booleanToString()', function () {
                test('Passing in no arguments returns an empty string', function () {
                    assert.strictEqual(_.booleanToString(), 'false');
                });

                test('Passing in a number returns the string "false"', function () {
                    assert.strictEqual(_.booleanToString(12), 'false');
                });

                test('Passing in an object returns the string "false"', function () {
                    assert.strictEqual(_.booleanToString({}), 'false');
                });

                test('Passing in an array returns the string "false"', function () {
                    assert.strictEqual(_.booleanToString([]), 'false');
                });

                test('Passing in a function returns the string "false"', function () {
                    assert.strictEqual(_.booleanToString(function(){}), 'false');
                });

                test('Passing in the boolean true returns the string "true"', function () {
                    assert.strictEqual(_.booleanToString(true), 'true');
                });

                test('Passing in the boolean false returns the string "false"', function () {
                    assert.strictEqual(_.booleanToString(false), 'false');
                });
            });

            suite('stringToBoolean()', function () {
                test('Passing in no arguments returns false', function () {
                    assert.strictEqual(_.stringToBoolean(), false);
                });

                test('Passing in a number returns false', function () {
                    assert.strictEqual(_.stringToBoolean(12), false);
                });

                test('Passing in an object returns false', function () {
                    assert.strictEqual(_.stringToBoolean({}), false);
                });

                test('Passing in an array returns false', function () {
                    assert.strictEqual(_.stringToBoolean([]), false);
                });

                test('Passing in a function returns false', function () {
                    assert.strictEqual(_.stringToBoolean(function(){}), false);
                });

                test('Passing in the string "true" returns true', function () {
                    assert.strictEqual(_.stringToBoolean('true'), true);
                });

                test('Passing in the string "false" returns false', function () {
                    assert.strictEqual(_.stringToBoolean('false'), false);
                });
            });

            suite('isDefined()', function () {
                test('No arguments returns false', function () {
                    assert.strictEqual(_.isDefined(), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual(_.isDefined(undefined), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual(_.isDefined(null), false);
                });

                test('Passing in true returns true', function () {
                    assert.strictEqual(_.isDefined(true), true);
                });

                test('Passing in an empty object returns true', function () {
                    assert.strictEqual(_.isDefined({}), true);
                });

                test('Passing in an empty object with isEmpty check returns false', function () {
                    assert.strictEqual(_.isDefined({}, true), false);
                });

                test('Passing in an empty string returns true', function () {
                    assert.strictEqual(_.isDefined(''), true);
                });

                test('Passing in an empty string with isEmpty check returns false', function () {
                    assert.strictEqual(_.isDefined('', true), false);
                });

                test('Passing in an empty array returns true', function () {
                    assert.strictEqual(_.isDefined([]), true);
                });

                test('Passing in an empty array with isEmpty check returns false', function () {
                    assert.strictEqual(_.isDefined([], true), false);
                });

                test('Passing in function returns true', function () {
                    assert.strictEqual(_.isDefined(function(){}), true);
                });

                test('Passing in an element returns true', function () {
                    assert.strictEqual(_.isDefined(document.querySelector('body')), true);
                });

                test('Passing in a jQuery object returns true', function () {
                    assert.strictEqual(_.isDefined(jQuery('body')), true);
                });
            });

            suite('isLooseEqual()', function () {
                test('Comparing null to null returns true', function () {
                    assert.strictEqual(_.isLooseEqual(null, null), true);
                });

                test('Passing in no arguments returns false', function () {
                    assert.strictEqual(_.isLooseEqual(), false);
                });

                test('Passing in anonymous functions returns true', function () {
                    assert.strictEqual(_.isLooseEqual(function(){}, function(){}), true);
                });

                test('Passing in slightly different anonymous functions returns false', function () {
                    assert.strictEqual(_.isLooseEqual(function(){}, function(){ jQuery.noop(); }), false);
                });

                test('Passing in two empty strings returns true', function () {
                    assert.strictEqual(_.isLooseEqual('', ''), true);
                });

                test('Passing in two empty objects returns true', function () {
                    assert.strictEqual(_.isLooseEqual({}, {}), true);
                });

                test('Passing in two empty arrays returns true', function () {
                    assert.strictEqual(_.isLooseEqual([], []), true);
                });

                test('Passing in a matching number and string returns true', function () {
                    assert.strictEqual(_.isLooseEqual('25', 25), true);
                });

                test('Passing in a matching number and string returns true (arguments flipped)', function () {
                    assert.strictEqual(_.isLooseEqual(25, '25'), true);
                });
            });

            suite('isShallowObject()', function () {
                test('Leaving off arguments returns false', function () {
                    assert.strictEqual(_.isShallowObject(), false);
                });

                test('Passing in an empty object returns false', function () {
                    assert.strictEqual(_.isShallowObject({}), false);
                });

                test('Passing in an empty array returns false', function () {
                    assert.strictEqual(_.isShallowObject([]), false);
                });

                test('Passing in an anonymous function returns false', function () {
                    assert.strictEqual(_.isShallowObject(function(){}), false);
                });

                test('Passing in an empty string returns false', function () {
                    assert.strictEqual(_.isShallowObject(''), false);
                });

                test('Passing in the string "25" false', function () {
                    assert.strictEqual(_.isShallowObject('25'), false);
                });

                test('Passing in the number 25 returns false', function () {
                    assert.strictEqual(_.isShallowObject(25), false);
                });

                test('Passing in a shallow object returns true', function () {
                    assert.strictEqual(_.isShallowObject({
                        key: 'value'
                    }), true);
                });

                test('Passing in a nested object returns false', function () {
                    assert.strictEqual(_.isShallowObject({
                        key: 'value',
                        nested: {
                            moore: 'gibbons' //watchmen reference ;)
                        }
                    }), false);
                });
            });

            suite('isTrueObject()', function () {
                test('Passing in nothing returns false', function () {
                    assert.strictEqual(_.isTrueObject(), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual(_.isTrueObject(null), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual(_.isTrueObject(undefined), false);
                });

                test('Passing in an empty array returns false', function () {
                    assert.strictEqual(_.isTrueObject([]), false);
                });

                test('Passing in an empty string returns false', function () {
                    assert.strictEqual(_.isTrueObject(''), false);
                });

                test('Passing in an anonymous function returns false', function () {
                    assert.strictEqual(_.isTrueObject(function () {}), false);
                });

                test('Passing in an empty object returns true', function () {
                    assert.strictEqual(_.isTrueObject({}), true);
                });

                test('Passing in a shallow object returns true', function () {
                    assert.strictEqual(_.isTrueObject({
                        key: 'value'
                    }), true);
                });

                test('Passing in a nested object returns true', function () {
                    assert.strictEqual(_.isTrueObject({
                        key: 'value',
                        nested: {
                            name: 'Robert Paulson'
                        }
                    }), true);
                });
            });

            suite('isURL()', function () {
                test('Passing in nothing returns false', function () {
                    assert.strictEqual(_.isURL(), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual(_.isURL(null), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual(_.isURL(undefined), false);
                });

                test('Passing in an empty string returns false', function () {
                    assert.strictEqual(_.isURL(''), false);
                });

                test('Passing in a number returns false', function () {
                    assert.strictEqual(_.isURL(25), false);
                });

                test('Passing in an empty array returns false', function () {
                    assert.strictEqual(_.isURL([]), false);
                });

                test('Passing in an empty object returns false', function () {
                    assert.strictEqual(_.isURL({}), false);
                });

                test('Passing in a function returns false', function () {
                    assert.strictEqual(_.isURL(function () {}), false);
                });

                test('Passing in an valid url (with "www") returns true', function () {
                    assert.strictEqual(_.isURL('http://www.google.com'), true);
                });

                test('Passing in an valid url (no "www") returns true', function () {
                    assert.strictEqual(_.isURL('http://feed.theplatform.com'), true);
                });

                test('Passing in an valid https url returns true', function () {
                    assert.strictEqual(_.isURL('https://feed.theplatform.com'), true);
                });

                test('Passing in an valid url with query params returns true', function () {
                    assert.strictEqual(_.isURL('http://feed.theplatform.com?form=json&range=1-1'), true);
                });
            });

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

            suite('dispatchEvent()', function () {
                test('Event dispatches over the library core (with no data payload)', function (done) {
                    var eventName = 'test';

                    $f.addEventListener(eventName, function (event) {
                        $f.removeEventListener($f.packageName +':'+ eventName);
                        done();
                    });

                    $f.dispatch(eventName);
                });

                test('Event dispatches over the library core (with data payload)', function (done) {
                    var eventName = 'dataTest';

                    $f.addEventListener(eventName, function (event) {
                        if (event.data.movie === 'Django')
                        {
                            done();
                        }

                        $f.removeEventListener($f.packageName +':'+ eventName);
                    });

                    $f.dispatch(eventName, {
                        movie: 'Django'
                    });
                });

                test('Event dispatches over the window object (no data payload)', function (done) {
                    var eventName = 'test';

                    window.addEventListener($f.packageName +':'+ eventName, function () {
                        window.removeEventListener(eventName);
                        done();
                    });

                    $f.dispatch(eventName, {}, true);
                });

                test('Event dispatches over the window object (with data payload)', function (done) {
                    var eventName = 'dataTest';

                    window.addEventListener($f.packageName +':'+ eventName, function (event) {
                        if (event.data.movie === 'Django')
                        {
                            done();
                        }

                        window.removeEventListener(eventName);
                    });

                    $f.dispatch(eventName, {
                        movie: 'Django'
                    }, true);
                });
            });

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
            test('jsonToBase64()', function () {
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

            test('base64ToJSON()', function () {
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
            suite('getPlayerAttributes()', function () {

                beforeEach(function () {
                    jQuery('#player').append('<div id="playerID" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true|siteSection=myFWSiteSection"></div>');

                    // add multiple players
                    jQuery('#players')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
                        .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');
                });

                afterEach(function () {
                    jQuery('#player').empty();
                    jQuery('#players').empty();
                });

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
                    var elementAttributes = $f.player.__test__.getPlayerAttributes(document.querySelector('#playerID'));
                    assert.deepEqual(elementAttributes, expected, 'getPlayerAttributes returned an object');
                });

                test('throws error when anything besides an HTML element is supplied', function () {
                    assert.throws(function () {
                        $f.player.__test__.getPlayerAttributes(jQuery('#playerID'));
                    }, noElementError);
                });

                test('Throws an error when an array of elements is supplied', function () {
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


        //------------------------------------------------------------------------------------- query
        suite('query', function () {
            suite('getFeedDetails()', function () {
                test('Passing in nothing returns a failed Promise', function (done) {
                    $f.query.getFeedDetails().fail(function (error) {
                        if (error.type === 'error' && error.description === "Whatever was passed to getFeedDetails() was undefined")
                        {
                            done();
                        }
                    });
                });

                test('Passing in null returns a failed Promise', function (done) {
                    $f.query.getFeedDetails(null).fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in undefined returns a failed Promise', function (done) {
                    $f.query.getFeedDetails(undefined).fail(function (error) {
                        if (error.type === 'error' && error.description === "Whatever was passed to getFeedDetails() was undefined")
                        {
                            done();
                        }
                    });
                });

                test('Passing in an empty string returns a failed Promise', function (done) {
                    $f.query.getFeedDetails('').fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in an empty array returns a failed Promise', function (done) {
                    $f.query.getFeedDetails([]).fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in an empty object returns a failed Promise', function (done) {
                    $f.query.getFeedDetails({}).fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in an empty anonymous function returns a failed Promise', function (done) {
                    $f.query.getFeedDetails(function () {}).fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in an invalid URL returns a failed Promise', function (done) {
                    $f.query.getFeedDetails('http://google').fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in a valid URL, but invalid feed URL returns a failed Promise', function (done) {
                    $f.query.getFeedDetails('http://google').fail(function (error) {
                        if (error.type === 'error' && error.description === "You didn't supply a valid feed URL to getFeedDetails()")
                        {
                            done();
                        }
                    });
                });

                test('Passing in a valid feed URL returns a resolved Promise', function (done) {
                    $f.query.getFeedDetails('http://feed.theplatform.com/f/fox.com/videos').done(function (json) {
                        if (_.isDefined(json))
                        {
                            done();
                        }
                    });
                });

                test('Getting a valid feed returns a shallow object (no arrays either)', function (done) {
                    $f.query.getFeedDetails('http://feed.theplatform.com/f/fox.com/videos').done(function (json) {
                        if (_.isDefined(json) && _.isShallowObject(json))
                        {
                            done();
                        }
                    });
                });
            });

            suite('getVideo() (returns a Promise)', function () {
                test('Passing in nothing fails', function (done) {
                    $f.query.getVideo().fail(function () {
                        done();
                    });
                });

                test('Passing in null fails', function (done) {
                    $f.query.getVideo(null).fail(function () {
                        done();
                    });
                });

                test('Passing in undefined fails', function (done) {
                    $f.query.getVideo(undefined).fail(function () {
                        done();
                    });
                });

                test('Passing in an empty string fails', function (done) {
                    $f.query.getVideo('').fail(function () {
                        done();
                    });
                });

                test('Passing in an empty array fails', function (done) {
                    $f.query.getVideo([]).fail(function () {
                        done();
                    });
                });

                test('Passing in an empty object fails', function (done) {
                    $f.query.getVideo({}).fail(function () {
                        done();
                    });
                });

                test('Passing in an anoynmous function fails', function (done) {
                    $f.query.getVideo(function () {}).fail(function () {
                        done();
                    });
                });

                test('Passing in a string, but not a valid one fails', function (done) {
                    $f.query.getVideo('something to think about').fail(function () {
                        done();
                    });
                });

                test('Passing in a feed URL returns a video object', function (done) {
                    $f.query.getVideo('http://feed.theplatform.com/f/fox.com/videos').always(function (response) {
                        console.dir(response);
                        done();
                    });
                });
            });

            suite('isFeedURL()', function () {
                test('Passing in nothing returns false', function () {
                    assert.strictEqual($f.query.isFeedURL(), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual($f.query.isFeedURL(null), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual($f.query.isFeedURL(undefined), false);
                });

                test('Passing in empty string returns false', function () {
                    assert.strictEqual($f.query.isFeedURL(''), false);
                });

                test('Passing in empty object returns false', function () {
                    assert.strictEqual($f.query.isFeedURL({}), false);
                });

                test('Passing in empty array returns false', function () {
                    assert.strictEqual($f.query.isFeedURL([]), false);
                });

                test('Passing in number returns false', function () {
                    assert.strictEqual($f.query.isFeedURL(50), false);
                });

                test('Passing in string returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('string test'), false);
                });

                test('Passing in URL with no protocol with www returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('www.google.com'), false);
                });

                test('Passing in URL with no protocol and no www returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('google.com'), false);
                });

                test('Passing in http://google.com (valid URL) returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('http://google.com'), false);
                });

                test('Passing in release URL returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('http://link.theplatform.com'), false);
                });

                test('Passing in URL with http:// returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('http://fox.com'), false);
                });

                test('Passing in URL with https:// returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('https://fox.com'), false);
                });

                test('Passing in URL with subdomain returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('http://something.theplatform.com'), false);
                });

                test('Passing in URL with query params returns false', function () {
                    assert.strictEqual($f.query.isFeedURL('https://www.google.com/?q=recursion'), false);
                });

                test('Passing in valid feed URL returns true', function () {
                    assert.strictEqual($f.query.isFeedURL('http://feed.theplatform.com/f/fox.com/videos?form=json&range=1-1'), true);
                });
            });

            suite('isGuid()', function () {
                test('Passing in nothing returns false', function () {
                    assert.strictEqual($f.query.isGuid(), false);
                });

                test('Passing in an empty string returns false', function () {
                    assert.strictEqual($f.query.isGuid(''), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual($f.query.isGuid(null), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual($f.query.isGuid(undefined), false);
                });

                test('Passing in a number returns false', function () {
                    assert.strictEqual($f.query.isGuid(25), false);
                });

                test('Passing in an empty object returns false', function () {
                    assert.strictEqual($f.query.isGuid({}), false);
                });

                test('Passing in an empty array returns false', function () {
                    assert.strictEqual($f.query.isGuid([]), false);
                });

                test('Passing in a real string (with spaces) returns false', function () {
                    assert.strictEqual($f.query.isGuid('this is a real string'), false);
                });

                test('Passing in a real string (without spaces) returns false', function () {
                    assert.strictEqual($f.query.isGuid('thisisarealstring'), false);
                });

                test('Passing in a real string (without spaces and 4 hyphens) returns false', function () {
                    assert.strictEqual($f.query.isGuid('this-is-a-real-string'), false);
                });

                test('Passing in almost a real guid (one missing character) returns false', function () {
                    assert.strictEqual($f.query.isGuid('bd24bca-f2b9-407c-b6e9-f1d650b10e86'), false);
                });

                test('Passing in a real guid returns true', function () {
                    assert.strictEqual($f.query.isGuid('bd324bca-f2b9-407c-b6e9-f1d650b10e86'), true);
                });
            });

            suite('isReleaseURL()', function () {
                test('Passing in nothing returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL(), false);
                });

                test('Passing in null returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL(null), false);
                });

                test('Passing in undefined returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL(undefined), false);
                });

                test('Passing in empty string returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL(''), false);
                });

                test('Passing in empty object returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL({}), false);
                });

                test('Passing in empty array returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL([]), false);
                });

                test('Passing in number returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL(50), false);
                });

                test('Passing in string returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('string test'), false);
                });

                test('Passing in URL with no protocol with www returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('www.google.com'), false);
                });

                test('Passing in URL with no protocol and no www returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('google.com'), false);
                });

                test('Passing in http://google.com (valid URL) returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('http://google.com'), false);
                });

                test('Passing in feed URL returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('http://feed.theplatform.com'), false);
                });

                test('Passing in URL with http:// returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('http://fox.com'), false);
                });

                test('Passing in URL with https:// returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('https://fox.com'), false);
                });

                test('Passing in URL with subdomain returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('http://something.theplatform.com'), false);
                });

                test('Passing in URL with query params returns false', function () {
                    assert.strictEqual($f.query.isReleaseURL('https://www.google.com/?q=recursion'), false);
                });

                test('Passing in valid feed URL returns true', function () {
                    assert.strictEqual($f.query.isReleaseURL('link.theplatform.com/s/fox.com/0Yrl5k4IJZwI?mbr=true&format=json'), true);
                });
            });
        });
        //------------------------------------------------------------------------------------- /query

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