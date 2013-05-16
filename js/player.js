/*global define, _ */

define(['require', 'ovp', 'player/iframe', 'player/playback', 'player/pdkwatcher', 'modal', 'debug'], function (require, ovp, iframe, playback, pdkwatcher, modal, Debug) {
    'use strict';

    var debug = new Debug('player');
    var _currentVideo = {};

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

    //---------------------------------------------- init
    (function () {
        //begin: add event listeners
//        ovp.addEventListener('OnMediaLoadStart', function (event) {
//            if (_.has(event.data, 'baseClip'))
//            {
//                _currentVideo = event.data;
//                debug.log("OnMediaLoadStart fired, and event.data was saved.", _currentVideo);
//            }
//        });
        //end: add event listeners
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
        destroy: ovp.destroy,

        //control methods
        seekTo: playback.seekTo,
        seek: playback.seekTo, //alias
        play: playback.play,

        //testing-only api (still public, but please DO NOT USE unless unit testing)
        __test__: {
            ovp: ovp,
            getPlayerAttributes: iframe.getPlayerAttributes,
            injectIframe: iframe.injectIframe
        },

        check: function () {
            return pdkwatcher;
        }
    };
});