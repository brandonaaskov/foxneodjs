/*global define */

define([
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, storage) {
    'use strict';

    var debug = new Debug('akamai media analytics'),
        dispatcher = new Dispatcher('akamai media analytics');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getUserId = function () {
        return storage.cookies.grab('Akamai_AnalyticsMetrics_clientId');
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getUserId: getUserId,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});