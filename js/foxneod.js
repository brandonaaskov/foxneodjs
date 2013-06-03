/*global define, _ */

define([
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'query',
    'system',
    'base64'], function (Dispatcher, Debug, polyfills, utils, player, query, system, base64) {
    'use strict';

    var buildTimestamp = '@@buildDate';
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    //-------------------------------------------------------------------------------- /private methods




    //-------------------------------------------------------------------------------- initialization
    var init = function () {
        debug.log('ready (build date: @@buildDate)');

        if (system.isBrowser('ie', 7) && system.isEngine('trident', 6))
        {
            window.alert("You're currently using Internet Explorer 10 in \"Compatibility\" mode, which has been " +
                "known to freeze the video. Please switch your browser into \"Standards\" mode to get a better " +
                "experience.");
        }
    };
    //-------------------------------------------------------------------------------- /initialization


    // Public API
    return {
        version: '@@version',
        packageName: '@@packageName',
        buildDate: '@@buildDate',
        init: init,
        player: player,
        query: query,
        utils: utils,
        Debug: Debug,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener,
        system: system,
        __test__: {
            base64: base64
        }
    };
});