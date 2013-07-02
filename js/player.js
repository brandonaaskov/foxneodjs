/*global define, _ */

define(['require',
    'ovp',
    'player/iframe',
    'player/playback',
    'modal',
    'Debug',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'query'
], function (require, ovp, iframe, playback, modal, Debug, jquery, _, Dispatcher, query) {
    'use strict';

    var debug = new Debug('player'),
        dispatcher = new Dispatcher(),
        _currentVideo = {},
        _mostRecentAd = {},
        _players = {},
        _currentPosition,
        _promisesQueue = [];

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

    var control = function (playerIdSelector) {
        var controllerToUse = getController(playerIdSelector);
        debug.log('setting controller', controllerToUse);
        playback._setController(controllerToUse);

        return playback;
    };

    var getController = function (selector) {
        var elements = jquery(selector),
            controllerToUse = null;

        _.each(elements, function (element) {
            var id = jquery(element).attr('id');

            if (!_.isUndefined(id))
            {
                _.each(_players, function (controller, playerId) {

                    if (playerId === id)
                    {
                        controllerToUse = controller;
                    }
                });
            }
        });

        if (controllerToUse)
        {
            return controllerToUse().controller;
        }

        debug.log('returning false');
        return false;
    };

    var loadVideo = function (releaseURLOrId, callback) {
        var deferred = jquery.Deferred();
        _promisesQueue.push({
            id: _.removeQueryParams(releaseURLOrId),
            deferred: deferred
        });

        if (!query.isReleaseURL(releaseURLOrId))
        {
            deferred.reject();
            throw new Error("The loadVideo() method expects one argument: a release URL");
        }

        //the 0 second timeout is to handle a bug in the PDK
        //calling it directly alongside other methods causes it to do nothing
        setTimeout(function () {
            debug.log('calling loadReleaseURL()', releaseURLOrId);
            ovp.controller().loadReleaseURL(releaseURLOrId, true); //loads release and replaces default
        }, 0);

        return deferred;
    };

    var getCurrentPosition = function () {
        var details = {
            position: null,
            duration: null,
            percentComplete: null
        };

        if (_.isTrueObject(_currentPosition) && !_.isEmpty(_currentPosition))
        {
            details.position = _currentPosition.currentTime;
            details.duration = _currentPosition.duration;
            details.percentComplete = _currentPosition.percentComplete;
        }

        return details;
    };

    var getPlayers = function () {
        return _players;
    };

    function init () {
        debug.log('init');

        ovp.addEventListener('ready', function () {

            debug.log('ovp ready', _players);

            //---------------------------------------- ovp initialize
            if (_.isTrueObject(_players) && !_.isEmpty(_players))
            {
                debug.log('binding players...', _players);

                _.each(_players, function (controller, id, list) {
                    if (!controller) //check for unbound
                    {
                        _players[id] = ovp.pdk.bind(id);
                        debug.log('binding player', id);
                        dispatcher.dispatch('playerCreated', { playerId: id });
                    }
                });

                debug.log('all players bound', _players);
                playback._setController(ovp.controller().controller);
            }
            else
            {
                //just one basic player on the page
                debug.log('setting the controller for the single, basic player');
                playback._setController(ovp.controller());
            }
            //---------------------------------------- /ovp initialize



            //---------------------------------------- ovp event listeners
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

            ovp.controller().addEventListener('OnMediaPlaying', function (event) {
                _currentPosition = event.data;
            });

            ovp.controller().addEventListener('OnLoadReleaseUrl', function (event) {
                var release = event.data;
                debug.log('OnLoadReleaseUrl:release', release);

                var baseReleaseURL = _.removeQueryParams(release.url),
                    matchedPromise;

                _.each(_promisesQueue, function (item) {
                    if (baseReleaseURL === item.id)
                    {
                        debug.log('matched promise', item);
                        matchedPromise = item;
                    }
                });

                //let's end the deferred object for this thing
                if (matchedPromise && _.has(matchedPromise, 'deferred'))
                {
                    matchedPromise.deferred.resolve(release);
                }
            });
        });
        //---------------------------------------- /ovp event listeners


        //---------------------------------------- iframe event listeners
        iframe.addEventListener('htmlInjected', function (event) {
            var controller = null;

            if (ovp.isReady())
            {
                //if ovp is already good to go, we can bind now, otherwise we'll bind when ovp:ready fires
                controller = ovp.pdk.bind(event.data.playerId);
                debug.log('htmlInjected fired: binding player', event.data.playerId);
                dispatcher.dispatch('playerCreated', { playerId: event.data.playerId });
            }

            _players[event.data.playerId] = controller;
            debug.log('adding player to _players', {
                id: event.data.playerId,
                controller: controller
            });
        });
        //---------------------------------------- /iframe event listeners
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
        hide: ovp.hide,
        show: ovp.show,
        getCurrentVideo: getCurrentVideo,
        getMostRecentAd: getMostRecentAd,
        loadVideo: loadVideo,
        getPosition: getCurrentPosition,
        getPlayers: getPlayers,

        //control methods
        control: control,
        getController: getController,
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