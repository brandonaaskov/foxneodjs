/*global define */

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
        var deferred = new jquery.Deferred();

        _readyDeferred.done(function () {
            if (_.isFunction(_pdk.controller))
            {
                deferred.resolve(_pdk.controller().controller);
            }
            else if (_.isTrueObject(_pdk.controller))
            {
                deferred.resolve(_pdk.controller);
            }
            else if (!_.isUndefined(window.$pdk) && _.isTrueObject(window.$pdk))
            {
                deferred.resolve(window.$pdk.controller);
            }
            else
            {
                deferred.reject("The controller couldn't be found on the PDK object");
            }
        });

        return deferred;
    };

    var getEventsMap = function () {
        //since we only support one ovp right now, this is fine for the time being
        return thePlatform.getEventsMap();
    };

    var getReady = function () {
        return _readyDeferred;
    };

    var mapEvents = function (controller) {
        if (_.isUndefined(controller))
        {
            throw new Error("The controller supplied to mapEvents() was either undefined, empty, or not an object");
        }

        var eventsMap = thePlatform.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            controller.addEventListener(ovpEventName, function (event) {
                dispatcher.dispatch(ovpEventName, event);
            });
        });

        return controller;
    };

    var getPDK = function () {
        return _pdk;
    };

    var cleanVideoData = function () {

    };
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// init
    (function () {
        pdkwatcher.done(function (pdk) {
            _pdk = pdk;
            _readyDeferred.resolve(pdk);

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
        getController: getController,
        pdk: getPDK,
        getEventsMap: getEventsMap,
        mapEvents: mapEvents,
        cleanVideoData: cleanVideoData
    };
    ////////////////////////////////////////////////
});