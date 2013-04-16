/*global define, _, Modernizr */

define(['jquery', 'underscore', 'Modernizr', 'debug', 'base64', 'error'], function (jQueryApp, UnderscoreApp, ModernizrApp, Debug, Base64, Error) {
    'use strict';

    var version = '0.1.0',
        queue = [];

    var init = function () {
        Debug.checkForVersionChange('jQuery', jQueryApp, $);
        Debug.log('jQuery-' + jQueryApp().jquery);
        Debug.log('underscore-' + _.VERSION); //TODO: check this somehow since UnderscoreApp is undefined

        if (ModernizrApp && window.Modernizr)
        {
            Debug.checkForVersionChange('Modernizr', ModernizrApp, Modernizr);
        }

        Debug.log('Modernizr-' + ModernizrApp._version);
        Debug.log('Nibbler-' + version);

        var data = getEmptyTrackingObject();
        data.category = 'Nibbler';
        data.name = 'load';

        track(data);
    };

    var track = _.throttle(function (trackingObject) {
        trackingObjectValidates(trackingObject);
        var data = Base64.jsonToBase64(trackingObject);

        Debug.log('Track Event', trackingObject);

        //TODO: make ajax request here
    }, 250);

    var trackingObjectValidates = function (trackingObject) {
        var emptyTrackingObject = getEmptyTrackingObject();

        for (var prop in emptyTrackingObject)
        {
            if (!trackingObject.hasOwnProperty(prop))
            {
                trackingObject[prop] = emptyTrackingObject[prop];

                var error = Error.getEmptyTrackingObject();
                error.category = 'Data Integrity';
                error.message = "One of the standard properties, " + prop + " was removed. We'll fix it, but you should too.";
                Debug.log(error.category, error, 'warn');

                return false;
            }
        }

        return true;
    };

    var getEmptyTrackingObject = function () {
        return {
            category: '',
            name: '',
            details: {
                version: version,
                url: window.location.href,
                timestamp: new Date().getTime()
            }
        };
    };

    // Public API
    return {
        init: init,
        initialize: init, //alias
        version: version,
        getEmptyTrackingObject: getEmptyTrackingObject,
        track: track
    };
});