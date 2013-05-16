/*global define, _ */

define(['debug'], function (Debug) {
    'use strict';

    var debug = new Debug('pdkwatcher'),
        _deferred = window.jQuery.Deferred();

    //yuck... so ghetto
    var interval = setInterval(function () {
        if (window.$pdk && _.has(window.$pdk, 'version'))
        {
            clearInterval(interval);
            debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
            _deferred.resolve();
        }
    }, 250);

    (function () {
        _deferred = window.jQuery.Deferred();
    })();

    return _deferred;
});