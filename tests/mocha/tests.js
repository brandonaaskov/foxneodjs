(function () {
    'use strict';

    mocha.setup('tdd');

    var assert = chai.assert,
        expect = chai.expect,
        should = chai.should;

    suite('foxneod', function () {

        //------------------------------------------------------------------------------------- utils

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

                // add multiple players
                jQuery('#players')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
                    .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');

                test('Throws an error when an array of elements is supplied', function () {
                    assert.throws(function () {
                        $f.player._test.getPlayerAttributes(document.querySelectorAll('.player'));
                    }, noElementError);
                });

                test('Tries to seek before the OVP controller was available', function () {
                    assert.throws(function () {
                        $f.player.seekTo(3);
                    }, "The OVP object was undefined.");
                });

                //sets up dummy pdk object for testing
                window.$pdk = {
                    controller: {
                        seekTo: function () {},
                        seek: function () {}
                    }
                }

                test('Seeks to 3 seconds properly (assumes PDK existence)', function () {
                    assert.strictEqual($f.player.seekTo(3), true);
                });

                test('Seeks to 0 seconds properly (assumes PDK existence)', function () {
                    assert.strictEqual($f.player.seekTo(0), true);
                });

                test("Throws error when value supplied isn't a number", function () {
                    assert.throws(function () {
                        $f.player.seekTo();
                    }, "The value supplied was not a valid number.");
                });

                test('Seeks to position provided as string', function () {
                    assert.strictEqual($f.player.seekTo("10"), true);
                });

                test('Seeks to floating point number', function () {
                    assert.strictEqual($f.player.seekTo(40.5), true);
                });

                test('Seeks to floating point number as a string', function () {
                    assert.strictEqual($f.player.seekTo("12.384734"), true);
                });

                test('Returns false (and does nothing) with a negative number', function () {
                    assert.strictEqual($f.player.seekTo(-2), false);
                });

                test('Returns false (and does nothing) with a negative number as a string', function () {
                    assert.strictEqual($f.player.seekTo("-30"), false);
                });

                test('Seeks properly to a supplied time with many, many decimal places', function () {
                    assert.strictEqual($f.player.seekTo(100.55234582394572328345723048957), true);
                });

                test("Seeks to a value longer than the video's length", function () {
                    assert.strictEqual($f.player.seekTo(1000000000000), false);
                });
            });
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

    mocha.run();
})();