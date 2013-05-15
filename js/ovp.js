/*global define, _, $ */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define(['debug', 'Dispatcher', 'utils', 'polyfills'], function (Debug, Dispatcher, utils, polyfills) {
    'use strict';

    var _pdk = {},
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher();

    (function () {
        //init

        //yuck... so ghetto
        var interval = setInterval(function () {
            if (window.$pdk && _.has(window.$pdk, 'version'))
            {
                clearInterval(interval);
                _pdk = window.$pdk;
                debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)');

                debug.log("putting jQuery into noConflict() mode (pdk doesn't do this)");
                window.jQuery.noConflict();
            }
        }, 250);
    })();

    // Public API
    return _pdk;
});