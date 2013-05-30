/*global define, _ */

define(['Debug', 'jqueryloader', 'underscoreloader'], function (Debug, jquery, _) {
    'use strict';

    var debug = new Debug('pdkwatcher'),
    _deferred = jquery.Deferred();

    //yuck... so ghetto
    var interval = setInterval(function () {
        if (window.$pdk && _.has(window.$pdk, 'controller'))
        {
            clearInterval(interval);
            debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
            _deferred.resolve(window.$pdk);
        }
    }, 150);

    return _deferred;
});