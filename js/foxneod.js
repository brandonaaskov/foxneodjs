/*global define, _ */

define(['Dispatcher', 'Debug', 'polyfills', 'utils', 'player'], function (Dispatcher, Debug, polyfills, utils, player) {
    'use strict';

    var buildTimestamp = '@@buildDate';
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    //-------------------------------------------------------------------------------- /private methods

    //-------------------------------------------------------------------------------- initialization
    (function init () {

        debug.log('ready', {
            buildDate: '@@buildDate',
            authors: '@@authors'
        });
    })();
    //-------------------------------------------------------------------------------- /initialization

    // Public API
    return {
        version: '@@version',
        packageName: '@@packageName',
        buildDate: '@@buildDate',
        player: player,
        utils: utils,
        Debug: Debug,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});