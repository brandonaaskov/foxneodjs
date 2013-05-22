/*global define, _ */

define([
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'system'], function (Dispatcher, Debug, polyfills, utils, player, system) {
    'use strict';

    var buildTimestamp = '@@buildDate';
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    //-------------------------------------------------------------------------------- /private methods




    //-------------------------------------------------------------------------------- initialization
    var init = function () {
        debug.log('ready (build date: @@buildDate)');

//        if ()
        if (system.isBrowser("chrome", 29) && system.isEngine('trident', 6))
        {
            debug.log('isBrowser');
            window.alert("You're currently using IE10 in \"Compatibility\" mode, which has been known to provide a " +
                "poor playback experience. Please switch your browser into \"Standards\" mode to get a better " +
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
        utils: utils,
        Debug: Debug,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener,
        system: system
    };
});