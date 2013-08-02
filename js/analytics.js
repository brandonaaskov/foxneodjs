/*global define */

define([
    'underscoreloader',
    'Debug',
    'analytics/audience-manager',
    'analytics/akamai-media-analytics',
    'analytics/omniture'
], function (_, Debug, audienceManager, ama, omniture) {
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

    // Public API
    return {
        getAkamaiMediaAnalytics: getAkamaiMediaAnalytics,
        getAudienceManager: getAudienceManager
    };
});
