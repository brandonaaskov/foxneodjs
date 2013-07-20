/*global define, _ */

define(['utils', 'underscoreloader', 'jqueryloader', 'Debug', 'Dispatcher'], function (utils, _, jquery, Debug, Dispatcher) {
    'use strict';

    return function (selector, iframeURL, suppliedAttributes) {
        //-------------------------------------------------------------------------------- instance variables
        var debug = new Debug('iframe'),
            dispatcher = new Dispatcher(),
            _playerAttributes = {}, //these get passed down from player.js
            _processedAttributes = {},
            _playerToCreate,
            _deferred = new jquery.Deferred(),
            _onloadFired = false,
            _metaTagExists = false;
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

        function _onLoad (event) {
            debug.log('#2) onload fired');
            _onloadFired = true;
            _updateDeferred();
        }

        function _onMetaTagExists () {
//            debug.log('_onMetaTagExists fired');
//            _metaTagExists = true;
//            _updateDeferred();
        }

        function _updateDeferred () {

//            if (_metaTagExists && _onloadFired)
            debug.log('#3) meta tag exists');
            //TODO: this assumes the meta tag in the iframe page, which we obviously can't actually guarantee
            if (_onloadFired)
            {
                debug.log('resolving the iframe', _playerToCreate);
                _deferred.resolve(_playerToCreate);
            }
        }
        //-------------------------------------------------------------------------------- /private methods



        //-------------------------------------------------------------------------------- public methods
        var create = function () {
            var elements = [];
            _playerAttributes = suppliedAttributes;

            if (!_.isString(selector) || _.isEmpty(selector))
            {
                _deferred.reject("The first argument supplied to create() should be a selector");
            }

            var query = document.querySelectorAll(selector),
                atLeastOneElementFound = false;

            _.each(query, function (queryItem, index) {
                if (_.isElement(queryItem))
                {
                    debug.log('element found', queryItem);
                    _processedAttributes = _processAttributes(selector, suppliedAttributes);

                    if (!_.isEmpty(_processedAttributes))
                    {
                        elements.push({
                            controller: null,
                            element: queryItem,
                            attributes: _processedAttributes
                        });
                    }
                }
            });

            if (_.isEmpty(elements))
            {
                _deferred.reject("No players could be created from the selector you provided");
            }

            _playerToCreate = elements[0];

            _playerToCreate.element.innerHTML = _getIframeHTML(iframeURL, _playerToCreate.attributes);
            _playerToCreate.iframe = jquery(_playerToCreate.element).find('iframe')[0];

            document.getElementById(_playerToCreate.attributes.iframePlayerId).onload = function (event) {
                if (!_onloadFired)
                {
                    _onLoad(event);
                }
            };

            debug.log('#1) html injected', _playerToCreate);

            return getReady();


            /**
             * The code below is meant to handle multiple elements from the selector above. The problem is, it's hard
             * to do event-based stuff for multiple iframe's, and since this is a single instance per player, it
             * honestly should be managed at the player level anyway. For now, we'll default to the first element,
             * but I want to leave this code in here in case we need to revisit someday. Use or delete by: 10/19/13
             */
//            debug.log("We're going to try and create these", elements);
//
//            _.each(elements, function (playerToCreate) {
//                debug.log('iframe attributes', playerToCreate.attributes);
//
//                jquery(playerToCreate.element).bind('onload', _onLoad);
//                jquery(playerToCreate.element).bind('foxneod:metaTagExists', _onMetaTagExists);
//
//                playerToCreate.element.innerHTML = _getIframeHTML(iframeURL, playerToCreate.attributes);
//
//                debug.log('dispatching htmlInjected', playerToCreate.element);
//                dispatcher.dispatch('htmlInjected', {
//                    attributes: playerToCreate.attributes,
//                    element: playerToCreate.element
//                });
//            });
//
//            return true;
        };

        var getReady = function () {
            return _deferred;
        };
        //-------------------------------------------------------------------------------- public methods


        //-------------------------------------------------------------------------------- init
        (function () {
            //no initialization at the moment
        })();
        //-------------------------------------------------------------------------------- /init


        // This API is only Public to player.js, so we should surface everything so we can unit test it
        return {
            create: create,
            getReady: getReady,
            addEventListener: dispatcher.addEventListener,
            getEventListeners: dispatcher.getEventListeners,
            hasEventListener: dispatcher.hasEventListener,
            removeEventListener: dispatcher.removeEventListener
        };
    };
});