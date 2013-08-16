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
    function _handlePlayerEvent (event, ovpEventName, normalizedEventName) {
        var deferred = new jquery.Deferred();

        if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
        {
            deferred.reject(event);
            return;
        }

        var video = event.data.baseClip,
            cleanData = _cleanData(event.data.baseClip);

        switch (ovpEventName)
        {
            case 'OnMediaLoadStart':

                if (isAd(video))
                {
                    normalizedEventName = 'adStart';
                    storage.now.set('mostRecentAd', cleanData);
                }

                break;
        }

        dispatcher.dispatch(normalizedEventName, cleanData);
        dispatcher.up(normalizedEventName, cleanData);
        deferred.resolve(cleanData);

        return deferred;
    }

    function _checkForCompanions (data, normalizedEventName) {
        var deferred = new jquery.Deferred();

        //check for companion banners
        if (normalizedEventName === 'adStart' && _.isArray(data.banners) && !_.isEmpty(data.banners))
        {
            _.each(data.banners, function (banner) {
                if (!_.isUndefined(banner))
                {
                    dispatcher.dispatch('companionAd', banner);
                }
            });
        }

        deferred.resolve(data);

        return deferred;
    }

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
    var isAd = function (video) {
        return !!(_.has(video, 'isAd') && video.isAd);
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        var eventsMap = ovp.getEventsMap(),
            cleanData;

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            ovp.on(ovpEventName, function (event) {
                _handlePlayerEvent(event, ovpEventName, normalizedEventName).then(_checkForCompanions);
            });
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        isAd: isAd,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});