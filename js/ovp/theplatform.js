/*global define */

define([
    'lodash',
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
            videoLoading: 'OnMediaLoadStart',
            videoReady: 'OnLoadRelease',
            videoPause: 'OnMediaPause',
            videoPlay: 'OnMediaPlay',
            videoProgress: 'OnMediaPlaying',
            videoSeek: 'OnMediaSeek',
            videoStart: 'OnMediaStart',
            videoResume: 'OnMediaUnpause',
            videoMute: 'OnMute',
            playerReady: 'OnPlayerLoaded',
            playerOverlayUp: 'OnShowPlayOverlay'
        },
        _cleanedVideo = {
            id: null,
            title: null,
            description: null,
            length: null,
            guid: null,
            series: null,
            fullEpisode: null,
            genre: null
        };

    //////////////////////////////////////////////// private functions...
    ////////////////////////////////////////////////

    //////////////////////////////////////////////// public functions...
    var getEventsMap = function () {
        return _eventsMap;
    };

    var cleanEventData = function (video) {
        //validation happens at the ovp.js level

        return;

//        var cleaned = video;
//
//        if (!video.isAd)
//        {
//            cleaned = {
//                //standard elements
//                id: video.releaseID || null,
//                title: video.title || null,
//                description: video.description || null,
//                length: video.trueLength/1000 || null,
//
//                //ovp-specific elements
//                guid: video.guid,
//                series: video.categories[0].name || null //TODO process this to strip the "Series/" from the string
//            };
//
//            cleaned = _.map(video, 'releaseId');
//        }
//
////        else
////        {
////            //TODO finish this
////        }
//
//        return cleaned;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api
    return {
        getEventsMap: getEventsMap,
        cleanEventData: cleanEventData
    };
    ////////////////////////////////////////////////
});