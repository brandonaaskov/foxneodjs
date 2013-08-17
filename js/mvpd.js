/*global define */

define([
    'lodash',
    'Debug',
    'Dispatcher',
    'cookies'
], function (_, Debug, Dispatcher, cookies) {
    'use strict';

    var debug = new Debug('mvpd'),
        dispatcher = new Dispatcher();

    var getFreewheelKeyValues = function () {
        var cookie = cookies.grab('aam_freewheel');
        var keyValues = (_.isString(cookie) && !_.isEmpty(cookie)) ? cookie : '';

        return keyValues;
    };

    return {
        getFreewheelKeyValues: getFreewheelKeyValues
    };
});
