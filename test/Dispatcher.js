'use strict';

mocha.setup('tdd');

var assert = chai.assert;

suite('Dispatcher', function() {
    test('should observe dispatched events across dispatcher instances', function(done) {
        $f.addEventListener('foxneod:test', function(event) {
            assert.ok(event);
            done();
        });

        $f.dispatch('foxneod:test', true);
    });
});
