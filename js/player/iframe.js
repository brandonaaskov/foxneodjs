/*global define, _ */

define(['utils', 'underscoreloader', 'Debug', 'Dispatcher'], function (utils, _, Debug, Dispatcher) {
    'use strict';

    var debug = new Debug('iframe'),
        dispatcher = new Dispatcher(),
        _playerIndex = 0;

    function _enableExternalController() {
        var attributes = {
            name: "tp:EnableExternalController",
            content: "true"
        };

        if (!utils.tagInHead('script', attributes))
        {
            utils.addToHead('meta', attributes);
        }

        attributes = {
            type: 'text/javascript',
            src: '@@ovpAssetsFilePath' + 'pdk/tpPdkController.js'
        };

        if (!utils.tagInHead('script', attributes))
        {
            utils.addToHead('script', attributes);
        }

        debug.log('external controller added');
    }

    function _processPlayerAttributes(attributes, declaredAttributes) {
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
            debug: utils.getParamValue('debug')
        };

        attributes.id = attributes.id || 'js-player-' + _playerIndex++;
        dispatcher.dispatch('playerIdCreated', { playerId: attributes.id });

        attributes.iframeHeight = (_.has(attributes, 'iframeheight')) ? attributes.iframeheight : defaults.height;
        attributes.iframeWidth = (_.has(attributes, 'iframewidth')) ? attributes.iframewidth : defaults.width;
        attributes.width = defaults.width || attributes.iframeWidth;
        attributes.height = defaults.height || attributes.iframeHeight;
        attributes.debug = attributes.debug || defaults.debug;

        return attributes;
    }

    var getPlayerAttributes = function (element) {
        var playerAttributes = {},
            elementId;

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


    var injectIframePlayer = function (element, iframeURL, attributes) {
        var elements = [];

        if (_.isString(element) && !_.isEmpty(element)) //we got a selector
        {
            var query = document.querySelectorAll(element),
                atLeastOneElementFound = false;

            _.each(query, function (queryItem, index) {
                if (_.isElement(queryItem))
                {
                    debug.log('element found', queryItem);
                    var declaredAttributes = getPlayerAttributes(queryItem);

                    debug.log('declaredAttributes', declaredAttributes);

                    attributes = _processPlayerAttributes(attributes || {}, declaredAttributes);

                    elements.push({
                        element: queryItem,
                        attributes: attributes
                    });

                    atLeastOneElementFound = true;
                }
            });

            if (!atLeastOneElementFound)
            {
                throw new Error("No players could be created from the selector you provided");
            }
        }
        else {
            throw new Error("The first argument supplied to injectIframePlayer() should be a selector");
        }

        _.each(elements, function (playerToCreate) {
            debug.log('iframe attributes', playerToCreate.attributes);

            var attributesString = utils.objectToQueryString(playerToCreate.attributes);
            attributes = utils.lowerCasePropertyNames(playerToCreate.attributes);

            playerToCreate.element.innerHTML = '<iframe ' +
                'id="'+ attributes.id +'"' +
                'src="'+ iframeURL + '?' + attributesString + '"' +
                'scrolling="no" ' +
                'frameborder="0" ' +
                'width="' + attributes.iframewidth + '"' +
                'height="'+ attributes.iframeheight + '" webkitallowfullscreen mozallowfullscreen msallowfullscreen allowfullscreen></iframe>';

            debug.log('dispatching htmlInjected', playerToCreate.element);
            dispatcher.dispatch('htmlInjected', { playerId: attributes.id });
        });

        _enableExternalController();

        return true;
    };

    // This API is only Public to player.js, so we should surface everything so we can unit test it
    return {
        getPlayerAttributes: getPlayerAttributes,
        injectIframePlayer: injectIframePlayer,
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});