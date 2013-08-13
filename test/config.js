'use strict';

mocha.setup('tdd');

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

function getURL() {
    return window.location.href.split('?').shift();
}

function getURLDir() {
    var url = getURL();
    if (url.indexOf('.html', url.length - 5) !== -1) {
        url = url.split('/');
        url.pop();
        url = url.join('/');
    }
    if (url[url.length - 1] !== '/') {
        url += '/';
    }
    return url;
}

suite('config', function() {
    suite('lookup()', function() {
        test('should accept a valid URL', function(done) {
            $f.config(getURLDir() + 'assets/config.json').done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(jqXHR, response) {
                assert.fail(response, undefined, 'Validation failed "' + response + '"');
                done();
            });
        });

        test('should accept a valid network lookup name', function(done) {
            $f.config('test').done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(jqXHR, response) {
                assert.fail(response, undefined, 'Validation failed "' + response + '"');
                done();
            });
        });

        test('should not accept an invalid network lookup name', function(done) {
            $f.config('bad lookup').done(function(data) {
                assert.ok(false);
                done();
            }).fail(function(jqXHR, response) {
                assert.ok(true);
                done();
            });
        });
    });

    suite('validate()', function() {
        test('should pass when given no parameters', function(done) {
            $f.config().done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(data) {
                assert.fail(data, undefined, 'Validation failed');
                done();
            });
        });

        test('should pass when given a single valid object', function(done) {
            $f.config({
                shortname: 'test',
                name: 'test player',
                plugins: [],
                layout: [{
                    name: 'default layout',
                    type: 'layout',
                    files: [
                        'http://player.foxneodigital.com/fox/flash-layout.xml',
                        'http://player.foxneodigital.com/fox/js-layout.json'
                    ]
                }, {
                    name: 'live player layout',
                    type: 'layout',
                    files: 'http://player.foxneodigital.com/fox/live-layout.xml'
                }, {
                    name: 'default skin',
                    type: 'skin',
                    files: 'http://player.foxneodigital.com/fox/flash-skin.swf'
                }],
                colors: {
                    backgroundColor: '#000000',
                    controlBackgroundColor: '#000000',
                    controlColor: '#FFFFFF',
                    controlHoverColor: '#00b4ff',
                    controlSelectedColor: '#000000',
                    disabledColor: '#000000',
                    'fp.bgcolor': '#000000',
                    frameColor: '#000000',
                    playProgressColor: '#00b4ff',
                    textColor: '#BEBEBE',
                    loadProgressColor: '#BEBEBE',
                    controlHighlightColor: '#00b4ff'
                }
            }).done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(data) {
                assert.fail(data, undefined, 'Validation failed');
                done();
            });
        });

        test('should throw an error if a required key is missing', function(done) {
            try {
                $f.config({}).then(function() {
                    assert.fail(null, null, 'Validation should have thrown an error');
                    done();
                });
            } catch(err) {
                assert.ok(err);
                done();
            }
        });

        test('should use defaults if an optional key is missing', function(done) {
            $f.config({
                name: 'test'
            }).done(function(data) {
                assert.strictEqual(data.shortname, 'default');
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test('should extend config with second argument', function(done) {
            $f.config({
                name: 'test'
            }, {
                shortname: 'test'
            }).done(function(data) {
                assert.strictEqual(data.shortname, 'test');
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test('should not fail if second argument is invalid', function(done) {
            try {
                $f.config({
                    name: 'test'
                }, {}).done(function(data) {
                    assert.ok(data);
                    done();
                }).fail(function() {
                    assert.fail(null, null, 'Validation failed');
                    done();
                });
            } catch(err) {
                assert.fail(null, null, 'Validation failed');
                done();
            }
        });
    });
});
