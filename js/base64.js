/*global define */

define([], function () {
    'use strict';

    var jsonToBase64 = function (objectToEncode) {
        var jsonString = JSON.stringify(objectToEncode);
        var base64String = btoa(jsonString);

        return base64String;
    };

    var base64ToJSON = function (base64String) {
        var jsonString = atob(base64String);
        var json = JSON.parse(jsonString);

        return json;
    };

    // Public API
    return  {
        jsonToBase64: jsonToBase64,
        base64ToJSON: base64ToJSON
    };
});