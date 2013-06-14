/*global define, _ */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define(['Debug', 'Dispatcher', 'player/pdkwatcher', 'jqueryloader', 'utils', 'polyfills'], function (Debug, Dispatcher, pdkwatcher, jquery, utils, polyfills) {
    'use strict';

    var _pdk,
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher(),
        ready = false,
        selector = 'object[data^="http://player.foxfdm.com"]',
        version = '@@ovpVersion';

    var hide = function () {
        jquery(selector).each(function (index, element) {
            debug.log('hiding player element');
            jquery(this).parent().hide();
        });
    };

    var show = function () {
        jquery(selector).each(function (index, element) {
            debug.log('showing player element');
            jquery(this).parent().show();
        });
    };

    var getController = function () {
        if (ready)
        {
            return _pdk.controller;
        }
        else
        {
            throw new Error("The expected controller doesn't exist or wasn't available at the time this was called.");
        }
    };

    function constructor () {
        pdkwatcher.done(function (pdk) {
            ready = true;
            _pdk = pdk;
            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    }

    (function () {
        constructor();
    })();

    // Public API
    return {
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener,
        hide: hide,
        show: show,

        controller: function () {
            return getController();
        },
        pdk: function () {
            return _pdk;
        }
    };
});