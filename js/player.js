/*global define, _ */

define(['require',
        'ovp',
        'player/iframe',
        'player/playback',
        'modal',
        'Debug'
    ], function (require, ovp, iframe, playback, modal, Debug) {
    'use strict';

    var debug = new Debug('player'),
        _currentVideo = {},
        _mostRecentAd = {};

    var setPlayerMessage = function (options) {
        if (_.isObject(options))
        {
            modal.displayModal(options);
        }
        else
        {
            debug.log('setPlayerMessage expected 1 argument: an object of options.', options);
        }
    };

    var clearPlayerMessage = function () {
        modal.remove();
    };

    var getCurrentVideo = function () {
        return _currentVideo;
    };

    function constructor () {
        ovp.addEventListener('ready', function () {
            ovp.controller().addEventListener('OnMediaLoadStart', function (event) {
                if (!event.data.baseClip.isAd)
                {
                    _currentVideo = event.data;
                    debug.log("OnMediaLoadStart fired for content, and event.data was saved.", _currentVideo);
                }
                else
                {
                    _mostRecentAd = event.data;
                    debug.log("OnMediaLoadStart fired for an ad, and event.data was saved.", _mostRecentAd);
                }
            });
        });
    }

    var hide = function () {

    };

    var show = function () {

    };

    //---------------------------------------------- init
    (function () {
        constructor();
    })();
    //---------------------------------------------- /init

    /**
     * Most of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */
    return {
        //public api
        setPlayerMessage: setPlayerMessage,
        clearPlayerMessage: clearPlayerMessage,
        injectIframePlayers: iframe.injectIframePlayers,
        hide: ovp.hide,
        show: ovp.show,
        currentVideo: _currentVideo,
        getCurrentVideo: getCurrentVideo,

        //control methods
        seekTo: playback.seekTo,
        play: playback.play,
        pause: playback.pause,

        //testing-only api (still public, but please DO NOT USE unless unit testing)
        __test__: {
            ovp: ovp,
            getPlayerAttributes: iframe.getPlayerAttributes,
            injectIframe: iframe.injectIframe
        }
    };
});