/*global define */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define([
    'Debug',
    'Dispatcher',
    'player/pdkwatcher',
    'underscoreloader',
    'jqueryloader',
    'utils',
    'polyfills'
], function (Debug, Dispatcher, pdkwatcher, _, jquery, utils, polyfills) {
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
            if (_.isFunction(_pdk.controller))
            {
                return _pdk.controller().controller;
            }
            else if (_.isTrueObject(_pdk.controller))
            {
                return _pdk.controller;
            }
            else
            {
                throw new Error("The controller couldn't be found on the PDK object");
            }
        }

        else
        {
            throw new Error("The expected controller doesn't exist or wasn't available at the time this was called.");
        }
    };

    function constructor () {
        pdkwatcher.done(function (pdk) {
            _pdk = pdk;
            debug.log('PDK is now available inside of ovp.js', pdk);
            ready = true;
            dispatcher.dispatch('ready', pdk);
        });
    }

    (function () {
        constructor();
    })();

    // Public API
    return {
        isReady: function () {
            return ready;
        },
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
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