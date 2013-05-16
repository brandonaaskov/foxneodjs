/*global define, _ */

define(['Debug', 'ovp'], function (Debug, ovp) {
    'use strict';

    var debug = new Debug('playback');

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
                    ovp.controller().seekToPosition(seekTime);
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

    var play = function () {
        return ovp.controller().pause(false);
    };

    var pause = function () {
        return ovp.controller().pause(true);
    };

    //public api
    return {
        seekTo: seekTo,
        play: play,
        pause: pause
    };
});