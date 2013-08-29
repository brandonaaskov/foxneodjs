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

    var debug = new Debug('storage'),
        dispatcher = new Dispatcher('storage');

    //////////////////////////////////////////////// private methods...
    function isInsideIframe () {
        return now.get('insideIframe') || false;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var now = {
        get: function (key) {
            return JSON.parse(window.localStorage.getItem(key));
        },
        set: function (key, value) {
            debug.log('setting "' + key + '"', value);
            if (isInsideIframe())
            {
                debug.log('stored inside iframe, sending up...', [key, value]);
                dispatcher.up('storage', {
                    key: key,
                    value: value
                });
            }

            window.localStorage.setItem(key, JSON.stringify(value));
        },
        remove: function (key) {
            debug.log('removing "' + key + '"');
            window.localStorage.removeItem(key);
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