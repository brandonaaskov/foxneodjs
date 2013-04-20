/*global define, $, _, Modernizr */

define(['jquery', 'underscore', 'Modernizr', 'polyfills', 'debug'], function (jQueryApp, UnderscoreApp, ModernizrApp, polyfills, debug) {
    'use strict';

    var version = '0.1.0';

    var init = function () {
        polyfills.fixBrokenFeatures(); //setups up shims and polyfills
        debug.log('Polyfills added', polyfills.getShimsAdded());

        // deal with lib dependencies and make sure they're working properly
        debug.checkForVersionChange('jQuery', jQueryApp, $);
        debug.log('jQuery-' + jQueryApp().jquery);
        debug.log('underscore-' + (UnderscoreApp || _).VERSION);

        if (ModernizrApp && window.Modernizr)
        {
            debug.checkForVersionChange('Modernizr', ModernizrApp, Modernizr);

        }

        debug.log('Modernizr-' + (ModernizrApp || Modernizr)._version);

//        just test to make sure watch is working properly
//        var myTest = {
//            name: "Brandon"
//        };
//
//        myTest.watch('name', function () {
//            //args: propertyName, oldValue, newValue
//            debug.log('Watch fired', arguments);
//        });
//
//        setTimeout(function () {
//            myTest.name = 'Lauren';
//        }, 2500);
    };

    init();

    // Public API
    return {
//        init: init,
//        initialize: init, //alias
        version: version
    };
});