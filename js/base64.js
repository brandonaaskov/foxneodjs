/*global define */

define([
    'lodash'
], function (_) {
    'use strict';

    var encode = function (objectToEncode) {
        if (_.isUndefined(objectToEncode) || !_.isTrueObject(objectToEncode))
        {
            throw new Error("The encode() method expects an object for an argument");
        }

        var jsonString = JSON.stringify(objectToEncode);
        var base64String = btoa(jsonString);

        return base64String;
    };

    var decode = function (base64String) {
        if (!_.isString(base64String) && !_.isEmpty(base64String))
        {
            throw new Error("The decode() method expects a string for an argument");
        }

        var jsonString = atob(base64String);
        var json = JSON.parse(jsonString);

        return json;
    };

    // Public API
    return  {
        encode: encode,
        decode: decode
    };
});