/*global define, _ */

define([
    'Debug',
    'jquery',
    'lodash',
    'storage'
], function (Debug, jquery, _, storage) {
    'use strict';

    var debug = new Debug('pdkwatcher'),
        _deferred = jquery.Deferred(),
        _interval;

    //yuck... so ghetto (the PDK should dispatch an event when it's ready)
    (function init () {
        debug.log('init');

        _interval = setInterval(function () {
            if (window.$pdk && _.has(window.$pdk, 'controller'))
            {
                clearInterval(_interval);
                debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
                _deferred.resolve(window.$pdk);
            }

            if (storage.now.get('outsideIframe'))
            {
                debug.log('outside the iframe, no sense running this anymore');
                _deferred.reject();
                clearInterval(_interval);
            }

        }, 150);
    })();

    return _deferred;
});