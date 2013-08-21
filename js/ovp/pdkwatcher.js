/*global define, _ */

define([
    'Debug',
    'jquery',
    'lodash'
], function (Debug, $, _) {
    'use strict';

    var debug = new Debug('pdkwatcher'),
        _deferred = $.Deferred(),
        _interval;

    //yuck... so ghetto (the PDK should dispatch an event when it's ready)
    (function init () {
        _interval = setInterval(function () {
            if (window.$pdk && _.has(window.$pdk, 'controller'))
            {
                clearInterval(_interval);
                debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
                _deferred.resolve(window.$pdk);
            }
        }, 150);
    })();

    return _deferred;
});