/*global define */

define([
    'jquery',
    'lodash',
    'Debug',
    'Dispatcher',
    'cookies',
    'config'
], function (jquery, _, Debug, Dispatcher, cookies, config) {
    'use strict';

    var debug = new Debug('mvpd'),
        dispatcher = new Dispatcher(),
        mvpdInfo = false,
        accessEnablerAPI;

    var adobeAccessScript = 'http://entitlement.auth-staging.adobe.com/entitlement/AccessEnabler.js';

    var getFreewheelKeyValues = function () {
        var cookie = cookies.grab('aam_freewheel');
        var keyValues = (_.isString(cookie) && !_.isEmpty(cookie)) ? cookie : '';

        return keyValues;
    };

    var getInfo = function () {
        var info = config.getInfo();
        if (_.isObject(info)) {
            mvpdInfo = {
                shortname: info.shortname
            };
        }
        return mvpdInfo;
    };

    // This is called by the AccessEnablerHelper.js script that's loaded in an
    // IFrame by accessEnabler script.
    var entitlementLoaded = function() {
        // I think this is made globally available by the Adobe script.
        accessEnablerAPI = window.accessEnabler;
        accessEnablerAPI.getAuthentication(function() {
            debug.log('accessEnablerAPI.getAuthentication', arguments);
        });
    };

    (function init() {
        jquery.getScript(adobeAccessScript);
        window.entitlementLoaded = entitlementLoaded;
    })();

    return {
        getFreewheelKeyValues: getFreewheelKeyValues,
        getInfo: getInfo
    };
});
