/*global chai, suite, test, require */
'use strict';

if (typeof chai === 'undefined') {
    var chai = require('chai');
}

var assert = chai.assert;

suite('Dispatcher', function() {
    test.skip('should observe dispatched events across dispatcher instances', function(done) {
        $f.addEventListener('foxneod:test', function(event) {
            assert.ok(event);
            done();
        });

        $f.dispatch('foxneod:test', true);
    });
});
