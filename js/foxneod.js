/*global define, _ */

define([
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'query',
    'system',
    'base64',
    'jqueryloader'], function (Dispatcher, Debug, polyfills, utils, player, query, system, base64, jquery) {
    'use strict';

    var buildTimestamp = '@@buildDate';
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    //-------------------------------------------------------------------------------- /private methods


    function _messageUnsupportedUsers () {
        var title = "Unsupported Browser",
            message = '';

        if (system.isBrowser('ie', 7) && system.isEngine('trident', 6))
        {
            message = "You're currently using Internet Explorer 10 in \"Compatibility\" mode, which has been " +
                "known to freeze the video. Please switch your browser into \"Standards\" mode to get a better " +
                "experience.";
        }

        //show site modal
//        VideoAuth.Modal.open(null,'Incompatible Browser');
//        VideoAuth.Modal.content.set(jQuery('<div id="oops" class="video-auth"><h1 class="error-heading">Oops, so sorry!</h1><p class="error-message">Well, that didn\'t work.</p></div>'));
        if (_.has(window, 'VideoAuth') && _.has(window.VideoAuthyh, 'Modal'))
        {
            var $htmlFragment = jquery('<div id="foxneod-error"></div>');

            VideoAuth.Modal.open(null, title);
            VideoAuth.Modal.content.set($htmlFragment);
        }
    };


    //-------------------------------------------------------------------------------- initialization
    var init = function () {
        debug.log('ready (build date: @@buildDate)');

        _messageUnsupportedUsers();
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