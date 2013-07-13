/*global define, _ */

define(['utils', 'underscoreloader', 'Debug', 'Dispatcher'], function (utils, _, Debug, Dispatcher) {
    'use strict';

    //-------------------------------------------------------------------------------- instance variables
    var debug = new Debug('iframe'),
        dispatcher = new Dispatcher();
    //-------------------------------------------------------------------------------- /instance variables



    //-------------------------------------------------------------------------------- private methods
    /**
     * Adds some attributes on top of the ones created at the player.js level.
     *
     * @param attributes
     * @param declaredAttributes
     * @returns {*}
     * @private
     */
    function _processAttributes(selector, attributes, declaredAttributes) {
        if (_.isUndefined(attributes) || _.isEmpty(attributes))
        {
            throw new Error("_processIframeAttributes expects a populated attributes object. Please contact the " +
                "Fox NEOD team.");
        }

        attributes.iframePlayerId = 'js-player-' + attributes.playerIndex;
        attributes.iframeHeight = (_.has(attributes, 'iframeheight')) ? attributes.iframeheight : attributes.height;
        attributes.iframeWidth = (_.has(attributes, 'iframewidth')) ? attributes.iframewidth : attributes.width;

        return attributes;
    }

    function _getIframeHTML (iframeURL, attributes) {
        var attributesString = utils.objectToQueryString(attributes);
        attributes = utils.lowerCasePropertyNames(attributes);

        return '<iframe ' +
            'id="'+ attributes.iframeplayerid +'"' +
            'src="'+ iframeURL + '?' + attributesString + '"' +
            'scrolling="no" ' +
            'frameborder="0" ' +
            'width="' + attributes.iframewidth + '"' +
            'height="'+ attributes.iframeheight + '" webkitallowfullscreen mozallowfullscreen msallowfullscreen allowfullscreen></iframe>';
    }
    //-------------------------------------------------------------------------------- /private methods



    //-------------------------------------------------------------------------------- public methods
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

    var injectIframePlayer = function (selector, iframeURL, attributes) {
        var elements = [];

        if (_.isString(selector) && !_.isEmpty(selector)) //we got a selector
        {
            var query = document.querySelectorAll(selector),
                atLeastOneElementFound = false;

            _.each(query, function (queryItem, index) {
                if (_.isElement(queryItem))
                {
                    debug.log('element found', queryItem);

                    var declaredAttributes = getPlayerAttributes(queryItem);
                    debug.log('declaredAttributes', declaredAttributes);

                    attributes = _processAttributes(selector, attributes, declaredAttributes);

                    if (!_.isEmpty(attributes))
                    {
                        elements.push({
                            element: queryItem,
                            attributes: attributes
                        });

                        atLeastOneElementFound = true;
                    }
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

        debug.log("We're going to try and create these", elements);

        _.each(elements, function (playerToCreate) {
            debug.log('iframe attributes', playerToCreate.attributes);

            playerToCreate.element.innerHTML = _getIframeHTML(iframeURL, playerToCreate.attributes);

            debug.log('dispatching htmlInjected', playerToCreate.element);
            dispatcher.dispatch('htmlInjected', {
                attributes: playerToCreate.attributes,
                element: playerToCreate.element
            });
        });

        return true;
    };
    //-------------------------------------------------------------------------------- public methods


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