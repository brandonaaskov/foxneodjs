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
        _readyDeferred = new jquery.Deferred();


    //////////////////////////////////////////////// public methods
    var getController = function () {
        _readyDeferred.done(function () {
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
        });
    };

    var getEventsMap = function () {
        //since we only support one ovp right now, this is fine for the time being
        return thePlatform.getEventsMap();
    };

    var getReady = function () {
        return _readyDeferred;
    };

    var mapEvents = function (player) {
        var eventsMap = thePlatform.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            getController().addEventListener(ovpEventName, function (event) {
                debug.log('dispatching... ', [ovpEventName, normalizedEventName]);
//                dispatcher.dispatch(normalizedEventName, event);
                dispatcher.dispatch(ovpEventName, event);
            });
        });
    };

    var getPDK = function () {
        return _pdk;
    };
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// init
    (function () {
        pdkwatcher.done(function (pdk) {
            _pdk = pdk;
            _readyDeferred.resolve();

            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// Public API
    return {
        version: '@@ovpVersion',
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        ready: getReady,
        controller: function () {
            return getController();
        },
        pdk: getPDK,
        getEventsMap: getEventsMap,
        mapEvents: mapEvents
    };
    ////////////////////////////////////////////////
});