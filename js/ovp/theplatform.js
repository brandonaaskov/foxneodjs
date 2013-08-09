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
//            videoProgress: 'OnMediaPlaying',
            videoSeek: 'OnMediaSeek',
            videoStart: 'OnMediaStart',
            videoResume: 'OnMediaUnpause',
            videoMute: 'OnMute',
            playerReady: 'OnPlayerLoaded'
        };

    //////////////////////////////////////////////// public functions...
    var getEventsMap = function () {
        return _eventsMap;
    };

    var cleanVideoData = function (video) {
        //validation happens at the ovp.js level

        var cleaned = video;

        if (!video.isAd)
        {
            return {
                //standard elements
                id: video.releaseID || null,
                title: video.title || null,
                description: video.description || null,
                length: video.trueLength/1000 || null,

                //ovp-specific elements
                guid: video.guid,
                series: video.categories[0].name || null, //TODO process this to strip the "Series/" from the string
                brightcoveId: video.contentCustomData.brightcoveId || null,
                fullEpisode: video.contentCustomData.fullEpisode || null,
                genre: video.contentCustomData.genre || null //TODO parse to make sure we're not capturing "(None)"
            };
        }

//        else
//        {
//            //TODO finish this
//        }

        return cleaned;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api
    return {
        getEventsMap: getEventsMap,
        cleanVideoData: cleanVideoData
    };
    ////////////////////////////////////////////////
});