/*global define, _ */

define(['ovp', 'player/iframe', 'modal', 'debug'], function (ovp, iframe, modal, Debug) {
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

    /**
     * Takes the time to seek to in seconds, rounds it and seeks to that position. If the pdk isn't available, it
     * will return false
     * @param timeInSeconds
     * @returns {boolean}
     */
    var seekTo = function (timeInSeconds) {
        if (!_.isUndefined(ovp))
        {
            if (!_.isNaN(+timeInSeconds))
            {
                if (timeInSeconds >= 0)
                {
                    var seekTime = Math.round(timeInSeconds * 1000);
                    debug.log("Seeking to (in seconds)...", seekTime/1000);
                    ovp.seekToPosition(seekTime);
                }
                else
                {
                    debug.warn("The time you provided was less than 0, so no seeking occurred.", timeInSeconds);
                    return false;
                }
            }
            else
            {
                throw new Error("The value supplied was not a valid number.");
            }
        }
        else
        {
            throw new Error("The OVP object was undefined.");
        }

        return true;
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
        // Public API
        setPlayerMessage: setPlayerMessage,
        clearPlayerMessage: clearPlayerMessage,
        injectIframePlayers: iframe.injectIframePlayers,
        seekTo: seekTo,
        seek: seekTo, //alias

        //Testing-only API (still public, but please DO NOT USE unless unit testing)
        _test: {
            getPlayerAttributes: iframe.getPlayerAttributes,
            injectIframe: iframe.injectIframe
        }
    };
});