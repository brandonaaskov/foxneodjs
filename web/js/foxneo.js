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
    };

    // Public API
    return {
        init: init,
        initialize: init, //alias
        version: version
    };
});