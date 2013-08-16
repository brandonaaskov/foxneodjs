/*global define */

define([
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'storage',
    'ovp/theplatform',
    'player/pdkwatcher'
], function (_, $, utils, Debug, Dispatcher, storage, thePlatform, pdkwatcher) {
    'use strict';

    var debug = new Debug('ovp'),
        dispatcher = new Dispatcher('ovp'),
        _readyDeferred = new $.Deferred();


    //////////////////////////////////////////////// public methods
    var getController = function () {
        var deferred = new $.Deferred();

        _readyDeferred.done(function (pdk) {
            if (_.isUndefined(pdk) || !_.isTrueObject(pdk))
            {
                deferred.reject("The controller couldn't be found on the PDK object");
            }

            deferred.resolve(pdk.controller);
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

        _.each(thePlatform.getEventsMap(), function (ovpEventName, normalizedEventName) {
            debug.log('adding listener to controller (dispatching as '+ ovpEventName +')', ovpEventName);

            controller.addEventListener(ovpEventName, function (event) {

                dispatcher.dispatch(ovpEventName, event.data);

                if (storage.now().get('insideIframe'))
                {
                    dispatcher.up(ovpEventName, event.data);
                }
            });
        });

        return controller;
    };

    var cleanVideoData = function (video) {
        if (_.isUndefined(video))
        {
            throw new Error("The cleanVideoData() received undefined for its only argument");
        }

        return thePlatform.cleanVideoData(video);
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// init
    (function () {
        pdkwatcher.done(function (pdk) {
            _readyDeferred.resolve(pdk);

            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// Public API
    return {
        version: '@@ovpVersion',
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        ready: getReady,
        getController: getController,
        pdk: getReady,
        getEventsMap: getEventsMap,
        mapEvents: mapEvents,
        cleanVideoData: cleanVideoData
    };
    ////////////////////////////////////////////////
});