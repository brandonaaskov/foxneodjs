/*global define, _ */

define(['player', 'url', 'utils', 'css', 'polyfills', 'debug'], function (player, url, utils, css, polyfills, debug) {
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
        url: url,
        utils: utils,
        debug: debug
    };
});