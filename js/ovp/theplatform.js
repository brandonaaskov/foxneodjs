/*global define */

define([
    'underscoreloader',
    'utils',
    'Debug'
], function (_, utils, Debug) {
    'use strict';

    var debug = new Debug('ovp: theplatform'),
        _eventsMap = {
            videoLoad: 'OnLoadReleaseUrl',
            videoBuffer: 'OnMediaBuffer',
            videoEnd: 'OnMediaComplete',
            videoChapterEnd: 'OnMediaEnd',
            videoError: 'OnMediaError',
            videoReady: 'OnMediaLoadStart',
            videoPause: 'OnMediaPause',
            videoPlay: 'OnMediaPlay',
            videoProgress: 'OnMediaPlaying',
            videoSeek: 'OnMediaSeek',
            videoStart: 'OnMediaStart',
            videoResume: 'OnMediaUnpause',
            videoMute: 'OnMute',
            playerLoad: 'OnPlayerLoaded'
        };

    //////////////////////////////////////////////// public functions...
    var getEventsMap = function () {
        return _eventsMap;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api
    return {
        getEventsMap: getEventsMap
    };
    ////////////////////////////////////////////////
});