/*global define */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define([
    'ovp/theplatform',
    'Debug',
    'Dispatcher',
    'player/pdkwatcher',
    'underscoreloader',
    'jqueryloader',
    'utils',
    'polyfills'
], function (thePlatform, Debug, Dispatcher, pdkwatcher, _, jquery, utils, polyfills) {
    'use strict';

    var _pdk,
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher(),
        ready = false;


    //////////////////////////////////////////////// public methods
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

    var getEventsMap = function () {
        //since we only support one ovp right now, this is fine for the time being
        return thePlatform.getEventsMap();
    };

    var mapEvents = function (player) {
        var eventsMap = thePlatform.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            player.addEventListener(ovpEventName, function (event) {
                dispatcher.dispatch(normalizedEventName, event);
            });
        });
    };
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// init
    function constructor () {
        pdkwatcher.done(function (pdk) {
            _pdk = pdk;
            ready = true;

            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    }

    (function () {
        constructor();
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// Public API
    return {
        version: '@@ovpVersion',
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        isReady: function () {
            return ready;
        },
        controller: function () {
            return getController();
        },
        pdk: function () {
            return _pdk;
        },
        getEventsMap: getEventsMap,
        mapEvents: mapEvents
    };
    ////////////////////////////////////////////////
});