/*global define, _, console */

define(['utils'], function (utils) {
    'use strict';

    var debugMode = '@@debugMode'.toLowerCase();
    var prefix = '@@packageName-@@version: ';

    return function (category) {
        category = category || 'CATEGORY NOT SPECIFIED'; //setting a default

        var log = function (message, data) {
            var debugQueryParam = utils.getQueryParams(window.location.href);

            if (utils.paramExists('debug'))
            {
                debugMode = utils.getParamValue('debug');
            }

            if (debugMode === category.toLowerCase() || debugMode === 'all')
            {
                console.log(prefix + category + ': ' + message, data || '');
            }
        };

        // Public API
        return {
            log: log
        };
    };
});