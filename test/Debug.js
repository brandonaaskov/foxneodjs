'use strict';

mocha.setup('tdd');

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should;

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