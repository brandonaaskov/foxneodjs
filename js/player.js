/*global define, FDM_Player */

define(['ovp',
    'player/Iframe',
    'player/playback',
    'modal',
    'Debug',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'query',
    'utils'
], function (ovp, Iframe, playback, modal, Debug, jquery, _, Dispatcher, query, utils) {
    'use strict';

    var debug = new Debug('player'),
        dispatcher = new Dispatcher(),
        _currentVideo = {},
        _mostRecentAd = {},
        _players = [],
        _currentPosition,
        _currentPlayer,
        _promisesQueue = [],
        _playerIndex = 0,
        _insideIframe = false;

    //////////////////////////////////////////////// private methods...
    function _processAttributes (selector, suppliedAttributes, declaredAttributes) {
        var attributes = suppliedAttributes || {};

        if (_.isDefined(declaredAttributes))
        {
            if (_.isTrueObject(attributes) && !_.isEmpty(attributes))
            {
                attributes = utils.override(declaredAttributes || {}, attributes);
            }
            else
            {
                attributes = declaredAttributes;
            }
        }

        /*
         * All of this just makes sure that we get a proper height/width to set on the iframe itself, which is
         * not always the same as the height and width of the player.
         */

        var defaults = {
            width: (_.has(attributes, 'width')) ? attributes.width : 640,
            height: (_.has(attributes, 'height')) ? attributes.height : 360,
            suppliedId: (_.has(attributes, 'suppliedId')) ? attributes.suppliedId : jquery(selector).attr('id'),
            debug: utils.getParamValue('debug')
        };

        attributes.width = defaults.width;
        attributes.height = defaults.height;
        attributes.playerIndex = _playerIndex++;
        attributes.debug = attributes.debug || defaults.debug;
        attributes.suppliedId = defaults.suppliedId;

        return attributes;
    }

    function _onLoadReleaseURL (event) {
        debug.log('OnLoadReleaseURL fired', event);
        _currentPlayer.controller.removeEventListener('OnLoadReleaseURL', _onLoadReleaseURL);

        _.each(_promisesQueue, function (promiseDeets) {
            debug.log('promiseDeets', promiseDeets);

            debugger;
            promiseDeets.deferred.resolve(event);

            if (_.isFunction(promiseDeets.callback))
            {
                promiseDeets.callback(promiseDeets.deferred);
            }
        });
    }
    ////////////////////////////////////////////////



    ////////////////////////////////////////////////  ovp initialize...
    /**
     * Right now since we're still using the FDM_Wrapper, the _bindPlayer() method is really only used for iframe players
     *
     * @param player
     * @private
     */
    function _bindPlayer(player)
    {
        var deferred = new jquery.Deferred();

        ovp.ready().done(function () {
            var attributes = player.attributes;

            if(!_insideIframe)
            {
                player.controller = window.$pdk.bind(attributes.iframePlayerId);
                ovp.mapEvents(player.controller);

                _players.push(player);
                debug.log('player bound, listeners added, and added to the stack', _players);
                dispatcher.dispatch('playerCreated', player);

                _currentPlayer = player;
                deferred.resolve(player);
            }
        });

        return deferred;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
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

        if (_.isUndefined(selector))
        {
            if (_.isUndefined(_currentPlayer.controller))
            {
                throw new Error("There was no default controller to return");
            }

            return _currentPlayer.controller;
        }
        else
        {
            _.each(elements, function (element) {
                var id = jquery(element).attr('id');

                if (!_.isUndefined(id))
                {
                    _.each(_players, function (player) {
                        debug.log("searching for player controller...");
                        if (player.attributes.suppliedId === id || player.attributes.iframePlayerId === id)
                        {
                            controllerToUse = player.controller;
                        }
                    });
                }
            });

            if (_.isUndefined(controllerToUse) && (_.isObject(_currentPlayer) && !_.isEmpty(_currentPlayer)))
            {
                debug.log("using the default player's controller");
                controllerToUse = _currentPlayer.controller;
            }

            if (!_.isUndefined(controllerToUse) && !_.isEmpty(controllerToUse))
            {
                debug.log('controller to use', controllerToUse);
                return controllerToUse().controller;
            }
            else
            {
                debug.warn("The selector you provided doesn't point to a player on the page");
            }
        }

        debug.log('getController() returning false');
        return false;
    };

    var loadVideo = function (releaseURLOrId, callback) {
        //////////////////////////////////////////////// fail fast...
        var deferred = new jquery.Deferred(),
            errorMessage = '';

        if (!query.isReleaseURL(releaseURLOrId))
        {
            errorMessage = "The loadVideo() method expects one argument: a release URL";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }

        if (_.isUndefined(_currentPlayer))
        {
            errorMessage = "There was no default player set to load the video into";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }
        ////////////////////////////////////////////////

        _promisesQueue.push({
            id: _.removeQueryParams(releaseURLOrId),
            deferred: deferred,
            callback: callback
        });

        //////////////////////////////////////////////// load...
        _currentPlayer.controller.addEventListener('OnLoadReleaseUrl', _onLoadReleaseURL);

        debug.log('calling loadReleaseURL()', releaseURLOrId);
        _currentPlayer.controller.loadReleaseURL(releaseURLOrId, true);
        ////////////////////////////////////////////////

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

    /**
     * Creates a player in the page at the given selector.
     *
     * @param selector {String} Selector string to the HTML element where the player should get created
     * @param config {String|Object} String that points to a default configuration or an object providing
     * the config to use
     * @returns {Object} Returns the final config object
     */
    var createPlayer = function (selector, config) {
        //validate selector argument
        if (_.isUndefined(selector) || !_.isString(selector) || _.isEmpty(selector))
        {
            throw new Error("The first argument supplied to create() should be a selector string");
        }

        //validate config argument
        if (_.isEmpty(config) || (!_.isString(config) && !_.isTrueObject(config)))
        {
            throw new Error("The second argument supplied to create() should be either a network acronym or a non-empty object");
        }

        try {
            var player = window.player = {},
                pdkDebug = _.find(debug.getDebugModes(), function (debugMode) {
                    if (_.isEqual(debugMode, 'pdk'))
                    {
                        return true;
                    }
                });

            config = _processAttributes(selector, config);

            window['player'] = config;
            var fdmPlayer = new FDM_Player('player', config.width, config.height);

            player.logLevel= (_.isEqual(pdkDebug, 'pdk')) ? 'debug' : 'none';

            //we need to loop through the config to find out if we're inside the iframe or not
            _.each(config, function (prop, key) {
                if (_.isEqual(key, 'iframePlayerId'))
                {
                    _insideIframe = true;
                }
            });

            debug.log('PDK logLevel', player.logLevel);
            debug.log('creating player with config', config);
        }
        catch (error) {
            throw new Error(error);
        }

        return config;
    };

    /**
     * Get an array of all the current players being used
     *
     * @returns {Array} Returns an array of players that have been asked to be created, whether
     * they've been created or not yet
     */
    var getPlayers = function () {
        return _players;
    };

    var getPlayerByAttribute = function (key, value) {
        if (_.isUndefined(key) || _.isUndefined(value))
        {
            throw new Error("getPlayerByAttribute() expects two arguments: a key and a value");
        }

        if (!_.isString(key) || _.isEmpty(key))
        {
            throw new Error("The first argument for getPlayerByAttribute() should be a non-empty string");
        }

        if ((!_.isString(value) && !_.isNumber(value)) || _.isEmpty(value))
        {
            throw new Error("The second argument for getPlayerByAttribute() should be a non-empty string or a number");
        }

        if (!_.isEmpty(_players))
        {
            _.each(_players, function (player) {
                _.each(player, function (playerValue, playerKey) {
                    if (playerKey.toLowerCase() === key.toLowerCase() && playerValue.toLowerCase() === value.toLowerCase())
                    {
                        return player;
                    }
                });
            });
        }

        return false;
    };

    /**
     * Get's any declarative player attributes (data-player).
     *
     * @param element The element to check for a data-player attribute
     * @returns {{}}
     */
    var getPlayerAttributes = function (selector) {
        var playerAttributes = {},
            elementId;

        var element = document.querySelectorAll(selector);

        //if there are multiple elements from the selector, just use the first one we found
        if (_.isObject(element))
        {
            element = element[0];
        }

        if (_.isDefined(element))
        {
            if (!_.isElement(element))
            {
                throw new Error("What you passed to getPlayerAttributes() wasn't an element. It was likely something " +
                    "like a jQuery object, but try using document.querySelector() or document.querySelectorAll() to get " +
                    "the element that you need. We try to not to depend on jQuery where we don't have to.");
            }

            var allAttributes = element.attributes;

            for (var i = 0, n = allAttributes.length; i < n; i++)
            {
                var attr = allAttributes[i],
                    attrName = attr.nodeName;

                if (attrName === 'data-player')
                {
                    playerAttributes = utils.pipeStringToObject(attr.nodeValue);
                }

                if (attrName === 'id')
                {
                    elementId = attr.nodeValue;
                }
            }

            //if the element supplied has an ID, just use that since it's unique (or at least it should be!)
            if (elementId)
            {
                playerAttributes.id = elementId;
            }
        }
        else
        {
            debug.warn("You called getPlayerAttributes() and whatever you passed (or didn't pass to it) was " +
                "undefined. Thought you should know since it's probably giving you a headache by now :)");
        }

        return playerAttributes;
    };

    /**
     *
     * @param selector
     * @param iframeURL
     * @param suppliedAttributes
     */
    var injectIframePlayer = function (selector, iframeURL, suppliedAttributes) {
        var declaredAttributes = getPlayerAttributes(selector);
        debug.log('declaredAttributes', declaredAttributes);

        var attributes = _processAttributes(selector, suppliedAttributes, declaredAttributes);
        var iframe = new Iframe(selector, iframeURL, attributes);

        var iframePlayer = iframe.create()
            .then(function (player) {
                iframePlayer = player;
                return; //returns a Promise
            })
            .then(function () {
                return _bindPlayer(iframePlayer);
            })
            .then(function (player) {
                //interact with the player?
            });
    };

    var hide = function () {
        playback.pause();
        jquery(_currentPlayer.element).hide();

        return true;
    };

    var show = function () {
        jquery(_currentPlayer.element).show();

        return true;
    };

    var isInsideIframe = function () {
        return _insideIframe;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// init...
    (function init () {
        ovp.ready().done(function () {

            ovp.getController().done(function (controller) {
                if (!_insideIframe)
                {
                    return;
                }

                ovp.mapEvents(controller);

                var eventsMap = ovp.getEventsMap();

                _.each(eventsMap, function (ovpEventName, normalizedEventName) {
                    debug.log('adding listener to controller', [ovpEventName, controller]);

                    ///////////////////////// translate event name and dispatch
                    controller.addEventListener(ovpEventName, function (event) {
//                        debug.log('received: ' + ovpEventName, event.data);

//                        var videoData = (normalizedEventName !== 'playerReady') ? ovp.cleanVideoData(event.data) : {};
//                        debug.log('dispatching: ' + normalizedEventName, videoData);
                    });
                    /////////////////////////
                });
            }).fail(function (error) {
                throw new Error(error);
            });

        });
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api...
    /**
     * Most of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */
    return {
        //public api
        setPlayerMessage: setPlayerMessage,
        clearPlayerMessage: clearPlayerMessage,
        createIframe: injectIframePlayer,
        injectIframePlayer: injectIframePlayer, //old alias (will deprecate eventually)
        hide: hide,
        show: show,
        getCurrentVideo: getCurrentVideo,
        getMostRecentAd: getMostRecentAd,
        loadVideo: loadVideo,
        getPosition: getCurrentPosition,
        create: createPlayer,
        getPlayers: getPlayers,
        isInsideIframe: isInsideIframe,

        //control methods
        control: control,
        getController: getController,
        seekTo: playback.seekTo,
        play: playback.play,
        pause: playback.pause,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});