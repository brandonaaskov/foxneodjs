/*global define, _ */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define(['debug', 'Dispatcher', 'utils', 'polyfills'], function (Debug, Dispatcher, utils, polyfills) {
    'use strict';

    var _pdk = {},
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher();

    var destroy = function (selectorString) {
        if (!_.isUndefined(selectorString) && !_.isString(selectorString))
        {
            throw new Error("The selector you supplied to the destroy() method was not a string.");
        }

        var selector = selectorString || 'object[data^="http://player.foxfdm.com"]';
        window.jQuery(selector).parent().remove();

        return true;
    };

    var destroyScripts = function () {
        window.jQuery('script[src^="http://player.foxfdm.com/shared/1.4.522/pdk/"]').remove();
    };

    (function (_pdk) {
        //init

    })();

    // Public API
    return {
//        destroy: pdkwatcher.then().destroy
    };
});