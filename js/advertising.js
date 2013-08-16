/*global define */

define([
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'player',
    'ovp',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, player, ovp, storage) {
    'use strict';

    var debug = new Debug('advertising'),
        dispatcher = new Dispatcher('advertising');

    //////////////////////////////////////////////// private methods...
    function _cleanData (video) {
        var banners = !_.isEmpty(video.banners) ? video.banners : null;

        var cleanData = {
            title: video.title,
            banners: banners,
            url: video.URL,
            description: video.description,
            type: 'ad',
            id: video.releaseID,
            assetType: video.type,
            duration: video.trueLength
        };

        return cleanData;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        var eventsMap = ovp.getEventsMap(),
            cleanData;

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            ovp.on(ovpEventName, function (event) {
                if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
                {
                    return;
                }

                var video = event.data.baseClip,
                    cleanData = _cleanData(event.data.baseClip);

                switch (ovpEventName)
                {
                    case 'OnMediaLoadStart':

                        if (_.has(video, 'isAd'))
                        {
                            if (video.isAd)
                            {
                                normalizedEventName = 'adStart';
                                storage.now().set('mostRecentAd', cleanData);
                            }
                        }

                        break;
                }

                dispatcher.dispatch(normalizedEventName, cleanData);
                dispatcher.up(normalizedEventName, cleanData);

                //check for companion banners
                if (normalizedEventName === 'adStart' && _.isArray(cleanData.banners) && !_.isEmpty(cleanData.banners))
                {
                    _.each(cleanData.banners, function (banner) {
                        if (!_.isUndefined(banner))
                        {
                           dispatcher.dispatch('companionAd', banner);
                        }
                    });
                }
            });
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});