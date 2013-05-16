/*global define, _ */

//define(['player', 'utils', 'css', 'polyfills', 'debug', 'Dispatcher'], function (player, utils, css, polyfills, Debug, Dispatcher) {
//    'use strict';
//
//    var buildTimestamp = '@@buildDate';
//    var debug = new Debug('core'),
//        dispatcher = new Dispatcher();
//    //-------------------------------------------------------------------------------- /private methods
//
//    //-------------------------------------------------------------------------------- initialization
//    (function init () {
//
//        debug.log('ready', {
//            buildDate: '@@buildDate',
//            authors: '@@authors'
//        });
//    })();
//    //-------------------------------------------------------------------------------- /initialization
//
//    // Public API
//    return {
//        version: '@@version',
//        packageName: '@@packageName',
//        buildDate: '@@buildDate',
//        player: player,
//        utils: utils,
//        Debug: Debug,
//        dispatch: dispatcher.dispatch,
//        addEventListener: dispatcher.addEventListener,
//        removeEventListener: dispatcher.removeEventListener
//    };
//});

define(function (require) {
    'use strict';

    var Dispatcher = require('Dispatcher');
    var Debug = require('debug');
    require('polyfills');
    var player = require('player');
    var utils = require('utils');

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