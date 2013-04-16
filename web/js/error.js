/*global define */

define([], function () {
    'use strict';

    var getErrorObject = function (options) {
        var error = getEmptyErrorObject();

        for (var prop in options)
        {
            if (error[prop])
            {
                error[prop] = options[prop];
            }
        }

        return error;
    };

    var getEmptyErrorObject = function () {
        return {
            category: '',
            message: '',
            timestamp: new Date().getTime() //default
        };
    };

    // Public API
    return {
        getErrorObject: getErrorObject,
        getEmptyErrorObject: getEmptyErrorObject
    };
});