/*global define, _, console */

define(['utils', 'debug'], function (utils, debug) {
    'use strict';

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

                playerAttributes.iframeHeight = (_.has(lowercased, 'iframeheight')) ? lowercased.iframeheight : defaults.height;
                playerAttributes.iframeWidth = (_.has(lowercased, 'iframewidth')) ? lowercased.iframewidth : defaults.height;
            }
        }

        return playerAttributes;
    };


    var injectIframe = function (element, attributes, iframeURL) {
        if (element && _.isObject(element))
        {
            var attributesString = utils.objectToPipeString(attributes);
            attributes = utils.lowerCasePropertyNames(attributes);

            console.log('!!!!attributes', attributes);

            element.innerHTML = '<iframe ' +
                'src="'+ iframeURL + '?' + attributesString + '"' +
                'scrolling="no" ' +
                'frameborder="0" ' +
                'width="' + attributes.iframewidth + '"' +
                'height="'+ attributes.iframeheight + '"></iframe>';
        }
        else
        {
            throw new Error('The injectIframe() method expected an element, and it expects it to be an ' +
                'basic js object (not an array of elements).');
        }
    };

    var injectIframePlayers = function (selector, iframeURL) {
        var players = getPlayers(selector);

        for (var i = 0, n = players.length; i < n; i++)
        {
            var player = players[i];
            var attributes = getPlayerAttributes(player);

            injectIframe(player, attributes, iframeURL);
        }
    };

    (function () {
//        debug.log('iframe init');
    })();

    // Public API
    return {
        injectIframePlayers: injectIframePlayers
    };
});