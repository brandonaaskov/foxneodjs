/*global define */

define([
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'storage',
    'ovp/theplatform',
    'ovp/pdkwatcher'
], function (_, jquery, utils, Debug, Dispatcher, storage, thePlatform, pdkwatcher) {
    'use strict';

    var debug = new Debug('ovp'),
        dispatcher = new Dispatcher('ovp'),
        _readyDeferred = new jquery.Deferred(),
        _controllerDeferred = new jquery.Deferred();


    //////////////////////////////////////////////// public methods
    var getController = function () {

        _readyDeferred.done(function (pdk) {
            if (_.isUndefined(pdk) || !_.isTrueObject(pdk))
            {
                _controllerDeferred.reject("The controller couldn't be found on the PDK object");
            }

            if (!storage.now.get('iframeExists') || storage.now.get('insideIframe'))
            {
                if (_.isUndefined(pdk) || !_.has(pdk, 'controller'))
                {
                    throw new Error("For some unknown reason, there's no contoller on the pdk or the pdk was undefined");
                }

                _controllerDeferred.resolve(pdk.controller);
            }

            if (storage.now.get('outsideIframe') && storage.now.get('iframeExists'))
            {
                var player = storage.now.get('currentPlayer');
                var iframeId = jquery(player.iframe).attr('id');
                var controller = document.getElementById(iframeId).contentWindow['@@packageName']
                    .ovp.getController()
                    .done(function (controller) {
                        _controllerDeferred.resolve(controller);
                    });
            }
        });

        return _controllerDeferred;
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

                if (storage.now.get('insideIframe'))
                {
                    dispatcher.up(ovpEventName, event.data);
                }
            });
        });

        return controller;
    };

    var cleanEventData = function (event) {
        if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
        {
            return;
        }

        var video = event.data.baseClip;

        return thePlatform.cleanEventData(video);
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
    ////////////////////////////////////////////////
    return {
        version: '@@ovpVersion',
        ready: getReady,
        getController: getController,
        pdk: getReady,
        getEventsMap: getEventsMap,
        mapEvents: mapEvents,
        cleanEventData: cleanEventData,

        //event listening
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});