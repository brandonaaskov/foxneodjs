/*global define, AdobePass */

define([
    'jquery',
    'lodash',
    'Debug',
    'Dispatcher',
    'cookies'
], function (jquery, _, Debug, Dispatcher, cookies) {
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
        if (typeof AdobePass !== 'undefined') {
            mvpdInfo = mvpdInfo || {
                selectedMvpd: AdobePass.getSelectedMvpd(),
                lastMvpd: cookies.grab('last_mvpd')
            };
        }
        return mvpdInfo;
    };

    // Didn't see much MVPD lookup value in this, but I'm leaving it in in case
    // a need for it comes up. - Dave

    // This is called by the AccessEnablerHelper.js script that's loaded in an
    // IFrame by accessEnabler script.
    // var entitlementLoaded = function() {
    //     // I think this is made globally available by the Adobe script.
    //     accessEnablerAPI = window.accessEnabler;
    //     accessEnablerAPI.getAuthentication(function() {
    //         debug.log('accessEnablerAPI.getAuthentication', arguments);
    //     });
    // };

    // (function init() {
    //     jquery.getScript(adobeAccessScript);
    //     window.entitlementLoaded = entitlementLoaded;
    // })();

    return {
        getFreewheelKeyValues: getFreewheelKeyValues,
        getInfo: getInfo
    };
});
