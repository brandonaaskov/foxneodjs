'use strict';

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