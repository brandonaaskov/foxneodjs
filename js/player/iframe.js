/*global define, _ */

define(['utils', 'underscoreloader', 'jqueryloader', 'Debug', 'Dispatcher'], function (utils, _, jquery, Debug, Dispatcher) {
    'use strict';

    return function (selector, iframeURL, suppliedAttributes) {
        //-------------------------------------------------------------------------------- instance variables
        var debug = new Debug('iframe'),
            dispatcher = new Dispatcher(),
            _playerAttributes = {}; //these get passed down from player.js
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
        function _processAttributes(selector, attributes) {
            if (_.isUndefined(attributes) || _.isEmpty(attributes))
            {
                throw new Error("_processAttributes expects a populated attributes object. Please contact the " +
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
        var create = function () {
            var elements = [];
            _playerAttributes = suppliedAttributes;

            if (_.isString(selector) && !_.isEmpty(selector)) //we got a selector
            {
                var query = document.querySelectorAll(selector),
                    atLeastOneElementFound = false;

                _.each(query, function (queryItem, index) {
                    if (_.isElement(queryItem))
                    {
                        debug.log('element found', queryItem);

                        var attributes = _processAttributes(selector, suppliedAttributes);

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


        //-------------------------------------------------------------------------------- init
        (function () {
            debug.log('init');

            window.addEventListener('@@packageName:iframeReady', function (event) {
                debug.log("iframeReady event fired", event);
            });
        })();
        //-------------------------------------------------------------------------------- /init


        // This API is only Public to player.js, so we should surface everything so we can unit test it
        return {
            create: create,
            addEventListener: dispatcher.addEventListener,
            getEventListeners: dispatcher.getEventListeners,
            hasEventListener: dispatcher.hasEventListener,
            removeEventListener: dispatcher.removeEventListener
        };
    };
});