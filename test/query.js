/*global chai, suite, test, require */
'use strict';

if (typeof chai === 'undefined') {
    var chai = require('chai');
}

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

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
            $f.query.getVideo()
                .fail(function () {
                    done();
                });
        });

        test('Passing in null fails', function (done) {
            $f.query.getVideo(null)
                .fail(function () {
                    done();
                });
        });

        test('Passing in undefined fails', function (done) {
            $f.query.getVideo(undefined)
                .fail(function () {
                    done();
                });
        });

        test('Passing in an empty string fails', function (done) {
            $f.query.getVideo('')
                .fail(function (error) {
                    done();
                });
        });

        test('Passing in an empty array fails', function (done) {
            $f.query.getVideo([])
                .fail(function () {
                    done();
                });
        });

        test('Passing in an empty object fails', function (done) {
            $f.query.getVideo({})
                .fail(function () {
                    done();
                });
        });

        test('Passing in an anoynmous function fails', function (done) {
            $f.query.getVideo(function () {})
                .fail(function () {
                    done();
                });
        });

        test('Passing in a string, but not a valid one fails', function (done) {
            $f.query.getVideo('something to think about')
                .fail(function () {
                    done();
                });
        });

        test('Passing in a feed URL returns a video object', function (done) {
            $f.query.getVideo('http://feed.theplatform.com/f/fox.com/videos', function (response) {
                done();
            });
        });

        test('Passing in an invalid feed URL fires the callback', function (done) {
            $f.query.getVideo('http://invalid.theplatform.com/f/fox.com/videos', function (response) {
                done();
            });
        });

        test('Passing in a feed URL returns a video object to a callback', function (done) {
            $f.query.getFeedDetails('http://feed.theplatform.com/f/fox.com/videos')
                .done(function (json) {
                    if (_.isDefined(json) && _.isObject(json))
                    {
                        done();
                    }
                })
                .fail(function (error) {
                    console.log("Failed", error);
                });;
        });

        test('Passing in a valid guid (in the traditional format) returns a video object', function (done) {
            $f.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/videos');

            $f.query.getVideo('37058D8F-5BF6-6D1B-51D3-30B0F76B93A7')
                .done(function (response) {
                    done();
                })
                .fail(function (error) {
                    console.log("Failed", error);
                });
        });
    });

    suite('setDefaultFeedURL()', function () {
        test('Throws an error when nothing is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL();
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when null is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL(null);
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when undefined is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL(undefined);
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when an empty string is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL('');
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when an empty array is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL([]);
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when an empty object is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL({});
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when a number is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL(35);
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when an anonymous function is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL(function () {});
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Throws an error when an invalid URL is passed in', function () {
            assert.throws(function () {
                $f.query.setDefaultFeedURL("http://google.com");
            }, "The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        });

        test('Returns true when a valid feed URL (no params) is passed in', function () {
            assert.strictEqual($f.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/videos'), true);
        });

        test('Returns true when a valid feed URL (with params) is passed in', function () {
            assert.strictEqual($f.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/videos?form=json&byGuid=37058D8F-5BF6-6D1B-51D3-30B0F76B93A7'), true);
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