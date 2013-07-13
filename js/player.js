/*global define, FDM_Player */

define(['require',
    'ovp',
    'player/iframe',
    'player/playback',
    'modal',
    'Debug',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'query',
    'utils'
], function (require, ovp, iframe, playback, modal, Debug, jquery, _, Dispatcher, query, utils) {
    'use strict';

    var debug = new Debug('player'),
        dispatcher = new Dispatcher(),
        _currentVideo = {},
        _mostRecentAd = {},
        _players = [],
        _currentPosition,
        _promisesQueue = [],
        _playerIndex = 0;

    //---------------------------------------------- private methods
    function _enableExternalController (enableScriptTag, enableMetaTag) {
        var attributes = {
            name: "tp:EnableExternalController",
            content: "true"
        };

        if (!utils.tagInHead('script', attributes) && enableMetaTag)
        {
            utils.addToHead('meta', attributes);
        }
        else
        {
            debug.log('Page already has external controller meta tag');
        }

        attributes = {
            type: 'text/javascript',
            src: '@@ovpAssetsFilePath' + 'pdk/tpPdkController.js'
        };

        if (!utils.tagInHead('script', attributes) && enableScriptTag)
        {
            utils.addToHead('script', attributes);
        }
        else
        {
            debug.log('Page already has external controller script tag');
        }

        debug.log('external controller added');
    }

    function _processAttributes(selector, attributes, declaredAttributes) {
        attributes = attributes || {};

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
    //---------------------------------------------- /private methods



    //---------------------------------------------- public methods
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

        if (!_.isDefined(controllerToUse) || _.isEmpty(controllerToUse))
        {
            throw new Error("The selector you provided doesn't point to a player on the page");
        }

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
                _.each(_players, function (player) {

                    if (player.attributes.suppliedId === id || player.attributes.iframePlayerId === id)
                    {
                        controllerToUse = player.controller;
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

            _.each(config, function (prop, key) {
                player[prop] = config[prop];

                if (_.isEqual(key, 'iframePlayerId'))
                {
                    _enableExternalController('meta'); //adds controller to iframe page
                }
            });

            debug.log('PDK logLevel', player.logLevel);
            debug.log('creating player with config', config);
            //TODO: fix the coupling so that you can pass a selector to FDM_Player (or just finally replace the thing)
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
    //---------------------------------------------- /public methods



    //---------------------------------------------- init
    (function init () {
        debug.log('init');

        ovp.addEventListener('ready', function () {

            debug.log('ovp ready');

            //---------------------------------------- ovp initialize
            if (_.isArray(_players) && !_.isEmpty(_players))
            {
                debug.log('binding players...', _players);

                _.each(_players, function (player) {
                    if (!_.isUndefined(player.controller)) //check for unbound
                    {
                        player.controller = ovp.pdk.bind(player.attributes.iframePlayerId);

                        try {
                            document.getElementById(player.attributes.iframePlayerId).onload();
                        }
                        catch (error) {
                            jquery('#' + player.attributes.iframePlayerId).trigger('onload');
                            debug.warn("Calling onload() using getElementById() failed", error);
                        }

                        dispatcher.dispatch('playerCreated', player.attributes);
                    }
                });

                debug.log('all players bound', _players);
                playback._setController(ovp.controller().controller);
            }
            //---------------------------------------- /ovp initialize
        });


        //---------------------------------------- iframe event listeners
        iframe.addEventListener('htmlInjected', function (event) {
            debug.log('htmlInjected fired', event);

            var player = {
                controller: null,
                attributes: event.data.attributes,
                element: event.data.element
            };

            if (ovp.isReady())
            {
                //if ovp is already good to go, we can bind now, otherwise we'll bind when ovp:ready fires
                player.controller = ovp.pdk.bind(event.data.attributes.iframePlayerId);
                debug.log('binding player', event.data.attributes);
                dispatcher.dispatch('playerCreated', event.data.attributes);
            }

            debug.log('adding player to _players', player);

            _players.push(player);
        });
        //---------------------------------------- /iframe event listeners
    })();
    //---------------------------------------------- /init



    //---------------------------------------------- iframe facçade
    var injectIframePlayer = function (selector, iframeURL, attributes) {
        attributes = _processAttributes(selector, attributes);
        _enableExternalController('script');
        return iframe.injectIframePlayer(selector, iframeURL, attributes);
    };
    //---------------------------------------------- /iframe facçade



    /**
     * Most of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */
    return {
        //public api
        setPlayerMessage: setPlayerMessage,
        clearPlayerMessage: clearPlayerMessage,
        injectIframePlayer: injectIframePlayer,
        hide: ovp.hide,
        show: ovp.show,
        getCurrentVideo: getCurrentVideo,
        getMostRecentAd: getMostRecentAd,
        loadVideo: loadVideo,
        getPosition: getCurrentPosition,
        create: createPlayer,
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