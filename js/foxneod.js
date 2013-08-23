/*global define */

define([
    'lodash',
    'jquery-loader',
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'query',
    'system',
    'base64',
    'mvpd',
    'ovp',
    'advertising',
    'analytics',
    'storage'
], function (_, jquery, Dispatcher, Debug, polyfills, utils, player, query, system, base64, mvpd, ovp, advertising, analytics, storage) {
    'use strict';

    //////////////////////////////////////////////// instance variables
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public methods
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// private methods
    function _patchIE8Problems () {
        if (!_.has(window, 'addEventListener') && _.has(window, 'attachEvent'))
        {
            window.addEventListener = window.attachEvent;
        }
    }

    function _messageUnsupportedUsers () {
        var title = "Unsupported Browser",
            message = '';

        if (system.isBrowser('ie', 7))
        {
            if (system.isEngine('trident', 6))
            {
                message = "You're currently using Internet Explorer 10 in \"Compatibility\" mode, which has been " +
                    "known to freeze the video. Please switch your browser into \"Standards\" mode to get a better " +
                    "experience.";
            }
            else
            {
                message = "You're currently using Internet Explorer 7, which is an unsupported browser for video " +
                    "playback. We recommend switching to a more modern browser or upgrading IE to get a better " +
                    "experience.";
            }
        }

        //show site modal
        if (_.has(window, 'VideoAuth') && _.has(window.VideoAuth, 'Modal') && (!_.isEmpty(title) && !_.isEmpty(message)))
        {
            var $htmlFragment = jquery('<div id="foxneod-error">\n    <h1>Warning</h1>\n    <p class="error-message">' + message + '</p>\n</div>');

            window.VideoAuth.Modal.open(null, title);
            window.VideoAuth.Modal.content.set($htmlFragment);
        }
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialization
    var init = function () {
        debug.log('ready (build date: @@buildDate)');

        _patchIE8Problems();
        _messageUnsupportedUsers();
    };


    ////////////////////////////////////////////////


    // Public API
    return {
        //private
        _init: init,

        //properties
        buildDate: '@@buildDate',
        packageName: '@@packageName',
        version: '@@version',

        //event listening
        on: dispatcher.on,
        dispatch: dispatcher.dispatch,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,

        //modules being surfaced
        analytics: analytics,
        advertising: advertising,
//        config: config,
        Debug: Debug,
        dispatcher: dispatcher,
        mvpd: mvpd,
        ovp: ovp,
        player: player,
        query: query,
        storage: storage,
        system: system,
        utils: utils,

        //internal libraries being used
        _: _,
        jQuery: jquery
    };
});