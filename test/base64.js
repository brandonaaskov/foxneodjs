'use strict';

var chai = require('node_modules/chai/chai.js')
    , assert = chai.assert
    , expect = chai.expect
    , should = chai.should;

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