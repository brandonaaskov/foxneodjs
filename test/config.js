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
        test.skip('should accept a valid URL', function(done) {
            $f.config(getURLDir() + 'assets/config.json').done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(jqXHR, response) {
                assert.fail(response, undefined, 'Validation failed "' + response + '"');
                done();
            });
        });

        test.skip('should accept a valid network lookup name', function(done) {
            $f.config('test').done(function(data) {
                assert.ok(data);
                done();
            }).fail(function(jqXHR, response) {
                assert.fail(response, undefined, 'Validation failed "' + response + '"');
                done();
            });
        });

        test.skip('should not accept an invalid network lookup name', function(done) {
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
                name: 'test',
                shortname: 'test',
                network_name: 'test'
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

        test.skip('should use defaults if an optional key (with default specified) is missing', function(done) {
            $f.config({
                name: 'test',
                shortname: 'test',
                network_name: 'test'
            }).done(function(data) {
                assert.strictEqual(data.enable_html5, true);
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test.skip('should extend config with second argument', function(done) {
            $f.config({
                name: 'test',
                shortname: 'test',
                network_name: 'test'
            }, {
                shortname: 'test2'
            }).done(function(data) {
                assert.strictEqual(data.shortname, 'test2');
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test.skip('should not fail if second argument is invalid', function(done) {
            try {
                $f.config({
                    name: 'test',
                    shortname: 'test',
                    network_name: 'test'
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

        test.skip('should override existing properties with new ones', function(done) {
            $f.config({
                name: 'test',
                shortname: 'test-a',
                network_name: 'test'
            }, {
                shortname: 'test-b'
            }).done(function(data) {
                assert.strictEqual(data.shortname, 'test-b');
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test.skip('should not set default values if a field is not set and has no default value', function(done) {
            $f.config({
                name: 'test',
                shortname: 'test',
                network_name: 'test'
            }).done(function(data) {
                assert.isUndefined(data.version);
                done();
            }).fail(function() {
                assert.fail(null, null, 'validation failed');
                done();
            });
        });

        test.skip('should not set a value if an enum rule is specified and the value is bad', function(done) {
            try {
                $f.config({
                    name: 'test',
                    shortname: 'test',
                    network_name: 'test',
                    analytics: {
                        conviva: {
                            type: 'invalid',
                            customerId: 'test',
                            metadataKeys: 'test',
                            playerTags: 'test'
                        }
                    }
                }).done(function(data) {
                    assert.fail(null, null, 'Validation should have failed');
                    done();
                }).fail(function() {
                    assert.ok(true);
                    done();
                });
            } catch(err) {
                assert.ok(true);
                done();
            }
        });

        test.skip('should accept a value if an enum rule is specified and the value is valid', function(done) {
            try {
                $f.config({
                    name: 'test',
                    shortname: 'test',
                    network_name: 'test',
                    analytics: {
                        conviva: {
                            type: 'full',
                            customerId: 'test',
                            metadataKeys: 'test',
                            playerTags: 'test'
                        }
                    }
                }).done(function(data) {
                    assert.strictEqual(data.analytics.conviva.type, 'full');
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

        test.skip('should be able to delete existing optional settings', function(done) {
            $f.config({
                name: 'test',
                shortname: 'test',
                network_name: 'test',
                analytics: {
                    akamai: {
                        beaconPath: 'http://localhost:80'
                    }
                },
                version: 'test'
            }, {
                version: null
            }).done(function(data) {
                assert.isUndefined(data.version);
                done();
            }).fail(function() {
                assert.fail(null, null, 'Validation failed');
                done();
            });
        });

        test.skip('should not be able to delete required settings', function(done) {
            try {
                $f.config({
                    name: 'test',
                    shortname: null,
                    network_name: 'test',
                    analytics: {
                        akamai: {
                            beaconPath: 'http://localhost:80'
                        }
                    }
                }).done(function(data) {
                    assert.fail(null, null, 'Validation should have failed');
                    done();
                }).fail(function() {
                    assert.ok(true);
                    done();
                });
            } catch(err) {
                assert.ok(true);
                done();
            }
        });
    });
});
