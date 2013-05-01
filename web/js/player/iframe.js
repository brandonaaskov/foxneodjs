/*global define, _ */

define([], function () {
    'use strict';

    var initialized = false;

    var setPlayerMessage = function (options) {
        displayModal(options);
    };

    //--------------------------------------- iframe
    var iframe = function () {
        var playerIds = []; // stores the ids of the elements we find

        var getPlayers = function (selector) {
            var players = [];

            if (selector)
            {
                players = document.querySelectorAll(selector);
            }

            return players;
        };

        var getPlayerAttributes = function (element) {
            var allAttributes = element.attributes;
            var playerAttributes = {};

            for (var i = 0, n = allAttributes.length; i < n; i++)
            {
                var attr = allAttributes[i],
                    attrName = attr.nodeName;

                if (attrName.indexOf('data-player') !== -1)
                {
                    var attributes = attr.nodeValue.split('|');

                    for (var j = 0, m = attributes.length; j < m; j++)
                    {
                        var keyValuePair = attributes[j].split('=');
                        playerAttributes[keyValuePair[0]] = keyValuePair[1];
                    }
                }
            }

            return playerAttributes;
        };


        var injectIframe = function (element, attributes, iframeURL) {
            if (element && _.isObject(element))
            {
                var attributesString = utils().objectToPipeString(attributes);
//                        console.log('attributesString', attributesString);
                element.innerHTML = '<iframe ' +
                    'src="'+ iframeURL + '?' +
                    'playerParams=' + attributesString + '"' +
                    'scrolling="no" ' +
                    'frameborder="0" ' +
                    'width="' + attributes.width + '"' +
                    'height="'+ attributes.height + '"></iframe>';
            }
            else
            {
                throw new Error('The injectIframe() method expected an element, and it expects it to be an ' +
                    'basic js object (not an array of elements).');
            }
        };

        var swapPlayers = function (selector, iframeURL) {
            var players = getPlayers(selector);

            for (var i = 0, n = players.length; i < n; i++)
            {
                var player = players[i];
                var attributes = getPlayerAttributes(player);

                injectIframe(player, attributes, iframeURL);
            }
        };

        (function () {
//                console.log('iframe init');
        })();

        // Public API
        return {
            swapPlayers: swapPlayers
        };
    };
    //--------------------------------------- /iframe

    return {
        setPlayerMessage: setPlayerMessage,
        iframe: iframe
    }
});