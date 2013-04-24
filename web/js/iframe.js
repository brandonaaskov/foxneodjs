/*global define, _ */

define(['jquery', 'debug'], function ($, debug) {
    'use strict';

    return function () {
        (function init () {
            debug.log('init');
        })();

        var getPlayerConfig = function (containingElementID) {
            if (_.isString(containingElementID))
            {
                var $player = $('#' + containingElementID);
            }
        };

//    var injectIframe = function () {};

        var swapPlayer = function (containingElementID) {
            getPlayerConfig(containingElementID);
        };


        // Public API
        return {
            swapPlayer: swapPlayer
        };
    };
});