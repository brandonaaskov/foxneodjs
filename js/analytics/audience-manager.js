/*global define */

define([
    'underscoreloader',
    'Debug',
    'cookies'
], function (_, Debug, cookies) {
    'use strict';

    var _freewheelKeyValues = cookies.grab('aam_freewheel'),
        debug = new Debug('audience manager');

    var getUserId = function () {
        return cookies.grab('aam_uuid');
    };

    return {
        getUserId: getUserId
    };
});