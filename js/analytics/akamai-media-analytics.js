/*global define */

define([
    'underscoreloader',
    'Debug',
    'cookies'
], function (_, Debug, cookies) {
    'use strict';

    var debug = new Debug('akamai media analytics');

    var getUserId = function () {
        return cookies.grab('Akamai_AnalyticsMetrics_clientId');
    };

    return {
        getUserId: getUserId
    };
});