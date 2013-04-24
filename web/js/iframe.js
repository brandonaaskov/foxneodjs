/*global define, _ */

define(['jquery', 'debug'], function ($, debug) {
    'use strict';

    return function () {
        (function init () {
            //debug.log('iframe init');
        })();

        var getPlayerConfig = function (containingElementSelectorString) {
            if (_.isString(containingElementSelectorString))
            {
                var $player = $(containingElementSelectorString);
                debug.log('$player', $player);
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