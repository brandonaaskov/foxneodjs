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
        if (_.has(window, 'VideoAuth') && _.has(window.VideoAuth, 'Modal') && (!_.isEmpty(title) && !_.isEmpty(message)))
        {
            var $htmlFragment = jquery('<div id="foxneod-error">\n    <h1>Warning</h1>\n    <p class="error-message">' + message + '</p>\n</div>');

            window.VideoAuth.Modal.open(null, title);
            window.VideoAuth.Modal.content.set($htmlFragment);
        }
    }


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