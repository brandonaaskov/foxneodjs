/*global define, _ */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define(['debug', 'utils'], function (Debug, utils) {
    'use strict';

    var _pdk = {
            controller: {} //dummy for starters since we alias this in player.js right off the bat
        },
        debug = new Debug('ovp');

    /**
     * TODO: if the pdk doesn't exist, and methods get called on this (not the global $pdk object), catch them and
     * queue them for later (use underscore to queue and chain as needed)
     */

    (function () {
        //init

        if (_.has(window, '$pdk'))
        {
            _pdk = window.$pdk;
            debug.log("Page already had the PDK loaded in, so we're using that.");
        }
        else
        {
            debug.log("PDK wasn't ready, so we're watching the window object now.");

//            window.watch('$pdk', function (propertyName, oldValue, newValue) {
//                debug.log("PDK available via watch(), and we're storing the new value.", newValue);
////                _pdk = window.$pdk; //is this more reliable?
//
//                window.unwatch('$pdk');
//                _pdk = newValue;
//
//                utils.dispatchEvent('apiReady', _pdk); //allows for listening so that people can know when to interact
//            });
        }
    })();

    // Public API
    return _pdk;
});