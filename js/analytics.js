/*global define */

define([
    'underscoreloader',
    'Debug',
    'analytics/audience-manager',
    'analytics/akamai-media-analytics'
], function (_, Debug, audienceManager, ama) {
    'use strict';

    var debug = new Debug('analytics');

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

    return {
        getAkamaiMediaAnalytics: getAkamaiMediaAnalytics,
        getAudienceManager: getAudienceManager
    };
});
