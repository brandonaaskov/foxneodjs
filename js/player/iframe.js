/*global define, _ */

define(['utils', 'underscoreloader', 'Debug', 'Dispatcher'], function (utils, _, Debug, Dispatcher) {
    'use strict';

    var debug = new Debug('iframe'),
        dispatcher = new Dispatcher();

    function _enableExternalController() {
        var attributes = {
            name: "tp:EnableExternalController",
            content: "true"
        };

        utils.addToHead('meta', attributes);

        attributes = {
            type: 'text/javascript',
            src: '@@ovpAssetsFilePath' + 'pdk/tpPdkController.js'
        };

        utils.addToHead('script', attributes);
    }

    var getPlayerAttributes = function (element) {
        var playerAttributes = {};

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

                if (attrName.indexOf('data-player') !== -1)
                {
                    playerAttributes = utils.pipeStringToObject(attr.nodeValue);

                    /*
                     * All of this just makes sure that we get a proper height/width to set on the iframe itself, which is
                     * not always the same as the height and width of the player.
                     */
                    var lowercased = utils.lowerCasePropertyNames(playerAttributes);
                    var defaults = {
                        width: (_.has(lowercased, 'width')) ? lowercased.width : 640,
                        height: (_.has(lowercased, 'height')) ? lowercased.height : 360
                    };

                    playerAttributes.id = (_.has(lowercased, 'id')) ? lowercased.id : 'player' + i;
                    debug.log('playerAttributes.id', playerAttributes.id);
                    dispatcher.dispatch('playerIdCreated', { playerId: playerAttributes.id });

                    playerAttributes.iframeHeight = (_.has(lowercased, 'iframeheight')) ? lowercased.iframeheight : defaults.height;
                    playerAttributes.iframeWidth = (_.has(lowercased, 'iframewidth')) ? lowercased.iframewidth : defaults.width;
                }
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
        _enableExternalController();

        if (_.isString(element) && !_.isEmpty(element)) //we got a selector
        {
            var query = document.querySelectorAll(element);

            var atLeastOneElementFound = false;

            _.each(query, function (queryItem, index) {
                if (_.isElement(queryItem))
                {
                    debug.log('element found', queryItem);
                    if (_.isUndefined(attributes.id))
                    {
                        var defaultId = 'player' + index + '-' + _.random(0, 100000);
                        attributes.id = queryItem.getAttribute('id') || defaultId;
                        debug.log('default ID being applied', attributes.id);
                    }

                    atLeastOneElementFound = true;
                    injectIframePlayer(queryItem, iframeURL, attributes);
                }
                else if (_.isString(queryItem) && !_.isEmpty(queryItem))
                {
                    injectIframePlayer(queryItem, iframeURL, attributes);
                }
            });

            if (!atLeastOneElementFound)
            {
                debug.warn("No elements were found, so we're going to force an error by calling this again with an empty array", query);
                injectIframePlayer([], iframeURL, attributes);
            }
            else
            {
                // if we get here, it means that we found at least one element from our query above to create an
                // iframe in and since that calls this function recursively, we want to shut down its original
                // process by returning right here
                return;
            }
        }

        if (!_.isElement(element))
        {
            throw new Error("The first argument supplied to injectIframe() should be an HTML element (not an array, or jQuery object) or a selector string");
        }

        if (!_.isDefined(iframeURL) || !_.isString(iframeURL))
        {
            throw new Error("You didn't supply a valid iframe URL to use");
        }

        if (!_.isShallowObject(attributes))
        {
            throw new Error("The second argument supplied to injectIframe() should be a basic, shallow object of key-value pairs to use for attributes");
        }

        var attributesString = utils.objectToPipeString(attributes);
        attributes = utils.lowerCasePropertyNames(attributes);

        element.innerHTML = '<iframe ' +
            'id="'+ attributes.id +'"' +
            'src="'+ iframeURL + '?' + attributesString + '"' +
            'scrolling="no" ' +
            'frameborder="0" ' +
            'width="' + attributes.iframewidth + '"' +
            'height="'+ attributes.iframeheight + '" webkitallowfullscreen mozallowfullscreen msallowfullscreen allowfullscreen></iframe>';

        debug.log('dispatching created', element);
        dispatcher.dispatch('created', { playerId: attributes.id });

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