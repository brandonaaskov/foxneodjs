'use strict';

mocha.setup('tdd');

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

suite('player', function () {
    this.beforeEach(function () {
        jQuery('#player').append('<div id="playerID" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true|siteSection=myFWSiteSection"></div>');

        // add multiple players
        jQuery('#players')
            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/c8_9hFRvZiQB?mbr=true|siteSection=myFWSiteSection"></div>')
            .append('<div class="player" data-player="autoplay=true|width=400|height=200|fb=true|releaseURL=http://link.theplatform.com/s/btn/tKi4ID3iI0Tm?mbr=true|siteSection=myFWSiteSection"></div>')
            .append('<div class="player" data-player="autoplay=true|width=720|height=480|fb=true|releaseURL=http://link.theplatform.com/s/btn/jivltGVCLTXU?mbr=true|siteSection=myFWSiteSection"></div>')
            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/8rjdPiR1XR_3?mbr=true|siteSection=myFWSiteSection"></div>')
            .append('<div class="player" data-player="autoplay=true|width=640|height=360|fb=true|releaseURL=http://link.theplatform.com/s/btn/4EfeflYQCTPm?mbr=true|siteSection=myFWSiteSection"></div>');
    });

    this.afterEach(function () {
        jQuery('#player').empty();
        jQuery('#players').empty();
    });

    suite('getPlayerAttributes()', function () {
        var expected = {
            autoplay: 'true',
            width: '640',
            height: '360',
            id: "playerID",
            fb: 'true',
            releaseURL: 'http://link.theplatform.com/s/btn/yIzwkL89PBdK?mbr=true',
            siteSection: 'myFWSiteSection'
        };

        var noElementError = "What you passed to getPlayerAttributes() wasn't an element. It was likely something " +
            "like a jQuery object, but try using document.querySelector() or document.querySelectorAll() to get " +
            "the element that you need. We try to not to depend on jQuery where we don't have to.";

        test('converts data-player attributes pipe-separated kv pairs and adds iframeheight and iframewidth', function () {
            var elementAttributes = $f.player.__test__.getPlayerAttributes(document.querySelector('#playerID'));
            console.log('elementAttributes', elementAttributes);
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

    suite('injectIframePlayer()', function () {
        test("Passing in nothing throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer();
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in undefined throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer(undefined);
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in null throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer(null);
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in an empty object throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer({});
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in an empty string throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer('');
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in a number throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer(25);
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in an empty array throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer([]);
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in an anonymous function throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer(function () {});
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in a jQuery object as the first argument throws an error", function () {
            assert.throws(function () {
                $f.player.injectIframePlayer(jQuery('body'));
            }, "The first argument supplied to injectIframePlayer() should be a selector");
        });

        test("Passing in an invalid selector throws an error", function () {
            assert.throw(function () {
                $f.player.injectIframePlayer('nonexistent', 'page.html', { something: 'blah' });
            }, "No players could be created from the selector you provided");
        });

        test("Passing in a valid ID selector with no attributes works", function () {
            assert.strictEqual($f.player.injectIframePlayer('#playerID', 'page.html'), true);
        });


        test("Passing in a valid ID selector (with attributes) returns true", function () {
            assert.strictEqual($f.player.injectIframePlayer('#playerID', 'page.html', { something: 'blah' }), true);
        });

        test("Passing in a valid class selector (with attributes) returns true", function () {
            assert.strictEqual($f.player.injectIframePlayer('.player', 'page.html', { something: 'blah' }), true);
        });
    });

    suite('create(selector, config)', function () {
        test("Passing in nothing throws an error", function () {
            assert.throws(function () {
                $f.player.create();
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in null throws an error", function () {
            assert.throws(function () {
                $f.player.create(null);
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in an empty string throws an error", function () {
            assert.throws(function () {
                $f.player.create('');
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in an array throws an error", function () {
            assert.throws(function () {
                $f.player.create([]);
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in an object throws an error", function () {
            assert.throws(function () {
                $f.player.create({});
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in an anonymous function throws an error", function () {
            assert.throws(function () {
                $f.player.create(function () {});
            }, "The first argument supplied to create() should be a selector string");
        });

        test("Passing in an empty string for the second argument throws an error", function () {
            assert.throws(function () {
                $f.player.create('#player', '');
            }, "The second argument supplied to create() should be either a network acronym or a non-empty object");
        });

        test("Passing in an array for the second argument throws an error", function () {
            assert.throws(function () {
                $f.player.create('#player', []);
            }, "The second argument supplied to create() should be either a network acronym or a non-empty object");
        });

        test("Passing in an empty object for the second argument throws an error", function () {
            assert.throws(function () {
                $f.player.create('#player', {});
            }, "The second argument supplied to create() should be either a network acronym or a non-empty object");
        });

        test("Passing in a valid object for the second argument returns the config object", function () {
            var expected = {
                shortname: 'btn',
                name: 'Big Ten Networks'
            };

            assert.strictEqual($f.player.create('#player', expected), expected);
        });

        test("Passing in a valid object using overlay for the second argument returns the config object", function () {
            var expected = {
                shortname: 'ngc',
                name: 'National Geographic Channel',
                plugins: [{
                    name: 'freewheel',
                    type: 'advertising',
                    siteSectionId: null,
                    files: 'http://player.foxneodigital.com/swf/freewheel.swf'
                }, {
                    name: 'adobe analytics',
                    type: 'analytics',
                    reportSuite: 'overridetest',
                    trackingServer: 'a.fox.com',
                    files: [
                        'http://player.foxneodigital.com/swf/adobe-analytics.swf',
                        'http://player.foxneodigital.com/swf/adobe-analytics-media.swf']
                }, {
                    name: 'google analytics',
                    type: 'analytics',
                    accountId: 'UA-123456-78',
                    files: 'http://player.foxneodigital.com/swf/google-analytics.swf'
                }, {
                    name: 'chartbeat',
                    type: 'analytics',
                    files: 'http://player.foxneodigital.com/swf/chartbeat.swf'
                }, {
                    name: 'end card',
                    type: 'ui',
                    files: [
                        'http://player.foxneodigital.com/swf/end-card.swf',
                        'http://player.foxneodigital.com/js/end-card.js']
                }],
                layout: [{
                    name: 'default layout',
                    type: 'layout',
                    files: [
                        'http://player.foxneodigital.com/fox/flash-layout.xml',
                        'http://player.foxneodigital.com/fox/js-layout.json']
                }, {
                    name: 'live player layout',
                    type: 'layout',
                    files: 'http://player.foxneodigital.com/fox/live-layout.xml'
                }, {
                    name: 'default skin',
                    type: 'skin',
                    files: 'http://player.foxneodigital.com/fox/flash-skin.swf'
                }],
                colors: {}
            };

            assert.strictEqual($f.player.create('#player', {
                overlay: true,
                plugins: [{
                    name: 'adobe analytics',
                    reportSuite: 'overridetest'
                }]
            }), expected);
        });
    });

//    setPlayerMessage: setPlayerMessage,
//        clearPlayerMessage: clearPlayerMessage,
//        injectIframePlayer: iframe.injectIframePlayer,
//        hide: ovp.hide,
//        show: ovp.show,
//        getCurrentVideo: getCurrentVideo,
//        getMostRecentAd: getMostRecentAd,
//        loadVideo: loadVideo,
//        getPosition: getCurrentPosition,
//        getPlayers: getPlayers,
//
//        //control methods
//        control: control,
//        getController: getController,
//        seekTo: playback.seekTo,
//        play: playback.play,
//        pause: playback.pause,

    suite('loadVideo', function () {});

    //The first argument supplied to injectIframePlayer() should be either a selector, or an HTML element
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