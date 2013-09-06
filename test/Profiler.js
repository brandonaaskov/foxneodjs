/*global chai, suite, test, require */
'use strict';

if (typeof chai === 'undefined') {
    var chai = require('chai');
}

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

suite('Profiler', function() {
    test.skip('should not crash using constructor', function() {
        var profiler = $f.Profiler('test', true);
        var time = profiler.end();
        assert.isDefined(time);
    });

    test.skip('should not crash using static functions', function() {
        $f.Profiler.start('test');
        var time = $f.Profiler.end('test');
        assert.isDefined(time);
    });
});
