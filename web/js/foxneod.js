/*global define, _ */

define(['player', 'utils', 'css', 'polyfills', 'debug'], function (player, utils, css, polyfills, debug) {
    'use strict';

    var buildTimestamp = '@@buildDate';
    //-------------------------------------------------------------------------------- /private methods

    //-------------------------------------------------------------------------------- initialization
    (function init () {
        debug.log('Ready', {
            buildDate: '@@buildDate',
            authors: '@@authors'
        }, '!');
    })();
    //-------------------------------------------------------------------------------- /initialization

    // Public API
    return {
        version: '@@version',
        packageName: '@@packageName',
        player: player,
        utils: utils,
        debug: debug
    };
});