/*global define */

define([
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'cookies'
], function (_, jquery, utils, Debug, Dispatcher, cookies) {
    'use strict';

    var _keyValueStore = {},
        debug = new Debug('storage'),
        dispatcher = new Dispatcher('storage');

    //////////////////////////////////////////////// private methods...
    function isInsideIframe () {
        return now.get('insideIframe') || false;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var now = {
        get: function (key) {
            if (_.has(_keyValueStore, key))
            {
                return _keyValueStore[key];
            }

            return undefined;
        },
        set: function (key, value) {
            if (isInsideIframe())
            {
                debug.log('stored inside iframe, sending up...', [key, value]);
                dispatcher.up('storage', {
                    key: key,
                    value: value
                });
            }

            _keyValueStore[key] = value;
        },
        getAll: function () {
            return _keyValueStore;
        }
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        dispatcher.on('storage', function (event) {
            debug.log('got data from iframe - storing', event);
            now.set(event.data.key, event.data.value);
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        now: now,
        cookies: cookies,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});