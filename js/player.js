/*global define, _ */

define(['require',
    'ovp',
    'player/iframe',
    'player/playback',
    'modal',
    'Debug',
    'jqueryloader',
    'Dispatcher'
], function (require, ovp, iframe, playback, modal, Debug, jquery, Dispatcher) {
    'use strict';

    var debug = new Debug('player'),
        dispatcher = new Dispatcher(),
        _currentVideo = {},
        _mostRecentAd = {},
        _playerIds = [],
        _players = [];

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

    var getMostRecentAd = function () {
        return _mostRecentAd;
    };

    var getVideo = function (keyToMatch, valueToMatch) {
        if (_.isUndefined(keyToMatch))
        {
            debug.error("The key you supplied to getVideo() was undefined.");
        }

        //if feed, load first video in feed

        //if release, load release

        //if release list, load... something?

        //if guid, load guid from feed
    };

    var getController = function (selector) {
        var elements = jquery(selector);

        for (var j = 0, len = elements.length; j < len; j++)
        {
            var element = elements[j];

            var id = jquery(element).attr('id');

            if (!_.isUndefined(id))
            {
                for (var i = 0, length = _players.length; i < length; i++)
                {
                    var player = _players[i];
                    if (player.id === id)
                    {
                        debug.log('returning controller', player.controller().controller);
                        return player.controller().controller;
                    }
                }
            }
        }

        debug.log('returning false');
        return false;
    };

    function init () {
        debug.log('init');
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

        iframe.addEventListener('playerIdCreated', function (event) {
            if (_.isDefined(event.data.playerId))
            {
                _playerIds.push(event.data.playerId);
            }
        });

        iframe.addEventListener('created', function (event) {
            _players.push({
                id: event.data.playerId,
                controller: ovp.pdk.bind(event.data.playerId)
            });

            debug.log('player created');
            dispatcher.dispatch('playerCreated', { playerId: event.data.playerId });
        });
    }

    //---------------------------------------------- init
    (function () {
        init();
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
        injectIframePlayer: iframe.injectIframePlayer,
//        injectIframePlayers: iframe.injectIframePlayers,
        hide: ovp.hide,
        show: ovp.show,
//        currentVideo: _currentVideo,
        getCurrentVideo: getCurrentVideo,
        getMostRecentAd: getMostRecentAd,

        //control methods
        control: getController,
        seekTo: playback.seekTo,
        play: playback.play,
        pause: playback.pause,

        //event listening
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,

        //testing-only api (still public, but please DO NOT USE unless unit testing)
        __test__: {
            ovp: ovp,
            getPlayerAttributes: iframe.getPlayerAttributes,
            injectIframe: iframe.injectIframe
        }
    };
});