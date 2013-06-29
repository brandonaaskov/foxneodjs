/*global define, _ */

define(['Debug', 'ovp'], function (Debug, ovp) {
    'use strict';

    var debug = new Debug('playback'),
        _controller; //TODO: refactor how this is set and used

    var _setController = function (controller) {
        _controller = controller;
    };

    /**
     * Takes the time to seek to in seconds, rounds it and seeks to that position. If the pdk isn't available, it
     * will return false
     * @param timeInSeconds
     * @returns {boolean}
     */
    var seekTo = function (timeInSeconds) {
        if (_.isUndefined(ovp))
        {
            throw new Error("The OVP object was undefined.");
        }

        if (_.isNaN(+timeInSeconds))
        {
            throw new Error("The value supplied was not a valid number.");
        }


        if (timeInSeconds >= 0)
        {
            var seekTime = Math.round(timeInSeconds * 1000);
            debug.log("Seeking to (in seconds)...", seekTime/1000);
            _controller.seekToPosition(seekTime);
        }
        else
        {
            debug.warn("The time you provided was less than 0, so no seeking occurred.", timeInSeconds);
            return false;
        }

        return true;
    };

    var play = function () {
        return _controller.pause(false);
    };

    var pause = function () {
        return _controller.pause(true);
    };

    //public api
    return {
        _setController: _setController,
        seekTo: seekTo,
        play: play,
        pause: pause
    };
});