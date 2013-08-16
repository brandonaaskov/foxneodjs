/*global define */

define([
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'analytics/omnitureloader',
    'analytics/audience-manager',
    'analytics/akamai-media-analytics',
    'analytics/omniture'
], function (_, jquery, utils, Debug, Dispatcher, omnitureLoader, audienceManager, ama, omniture) {
    'use strict';

    var debug = new Debug('analytics'),
        dispatcher = new Dispatcher('analytics');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getOmnitureLibraryReady = function (account) {
        return omnitureLoader.getOmnitureLibrary(account);
    };

    var getAkamaiMediaAnalytics = function () {
        return {
            userId: ama.getUserId()
        };
    };

    var getAudienceManager = function () {
        return {
            userId: audienceManager.getUserId()
        };
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getOmnitureLibraryReady: getOmnitureLibraryReady,
        getAkamaiMediaAnalytics: getAkamaiMediaAnalytics,
        getAudienceManager: getAudienceManager,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});
