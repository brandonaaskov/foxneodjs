//---------------------------------------------------------------------------------------------------------- FoxNEO
/**
 * @project FoxNEO
 * @description Library for FDM video players
 * @author Brandon Aaskov
 * @version 0.1.0
 */
(function (window, undefined) {

    var FoxNEO = function () {
        //-------------------------------------------------------------------------------- initialization
        var fixBrokenFeatures = function () {
            //---------------------------------------------- underscore polyfills
            _ = window._ || {};

            var breaker = {};

            var ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype;

            var hasOwnProperty = ObjProto.hasOwnProperty;

            var nativeIsArray = Array.isArray,
                nativeIndexOf = ArrayProto.indexOf,
                nativeSome = ArrayProto.some,
                nativeForEach = ArrayProto.forEach;

            var each = _.each = _.forEach = function(obj, iterator, context) {
                if (obj == null) return;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    for (var key in obj) {
                        if (_.has(obj, key)) {
                            if (iterator.call(context, obj[key], key, obj) === breaker) return;
                        }
                    }
                }
            };

            _.isArray = nativeIsArray || function (obj) {
                return toString.call(obj) == '[object Array]';
            };

            _.isObject = function (obj) {
                return obj === Object(obj);
            };

            each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
                _['is' + name] = function(obj) {
                    return toString.call(obj) == '[object ' + name + ']';
                };
            });

            _.any = function(obj, iterator, context) {
                iterator || (iterator = _.identity);
                var result = false;
                if (obj == null) return result;
                if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
                _.each(obj, function(value, index, list) {
                    if (result || (result = iterator.call(context, value, index, list))) return breaker;
                });
                return !!result;
            };

            _.contains = function(obj, target) {
                if (obj == null) return false;
                if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
                return _.any(obj, function(value) {
                    return value === target;
                });
            };

            _.each = function(obj, iterator, context) {
                if (obj == null) return;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    for (var key in obj) {
                        if (_.has(obj, key)) {
                            if (iterator.call(context, obj[key], key, obj) === breaker) return;
                        }
                    }
                }
            };

            _.has = function(obj, key) {
                return hasOwnProperty.call(obj, key);
            };
            //---------------------------------------------- /underscore polyfills
        };

        (function init () {
            if (window.console)
            {
//                console.log('FoxNEO');
            }

            fixBrokenFeatures();
        })();
        //-------------------------------------------------------------------------------- /initialization



        //-------------------------------------------------------------------------------- public methods

        //--------------------------------------- player
        var player = function () {
            var core = function () {
                var setPlayerMessage = function (options) {
                    displayModal(options);
                };

                return {
                    setPlayerMessage: setPlayerMessage
                }
            };

            //--------------------------------------- iframe
            var iframe = function () {
                var playerIds = []; // stores the ids of the elements we find

                (function iframeInit () {
//                console.log('iframe init');
                })();

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


                var injectIframe = function (attributes, iframeURL) {
                    var elements = document.querySelectorAll('#' + attributes.id);

                    if (elements.length === 1)
                    {
                        var attributesString = utils().objectToPipeString(attributes);
//                        console.log('attributesString', attributesString);
                        var domElement = elements[0];
                        domElement.innerHTML = '<iframe ' +
                            'src="'+ iframeURL + '?' +
                            'playerParams=' + attributesString + '"' +
                            'scrolling="no" ' +
                            'frameborder="0" ' +
                            'width="' + attributes.width + '"' +
                            'height="'+ attributes.height + '"></iframe>';
                    }
                    else if (elements.length > 1)
                    {
                        throw new Error('The HTML ID you used for the player must be unique, ' +
                            'but there is more than one in this page.');
                    }
                };

                var swapPlayers = function (selector, iframeURL) {
                    var players = getPlayers(selector);

                    for (var i = 0, n = players.length; i < n; i++)
                    {
                        var player = players[i];
                        var attributes = getPlayerAttributes(player);

                        injectIframe(attributes, iframeURL);
                    }
                };

                // Public API
                return {
                    swapPlayers: swapPlayers
                };
            };
            //--------------------------------------- /iframe

            return {
                setPlayerMessage: core.setPlayerMessage,
                iframe: iframe
            }
        };
        //--------------------------------------- /player



        //--------------------------------------- utils
        var utils = function () {
            var arrayToObject = function (arr) {
                var obj = {};

                for (var i = 0, n = arr.length; i < n; i++)
                {
                    var item = arr[i];
                    if (item.indexOf('=') !== -1)
                    {
                        var itemPieces = item.split('=');

                        obj[itemPieces[0]] = itemPieces[1];
                    }
                }

                return obj;
            };

            //only supports shallow objects right now
            var objectToArray = function (obj) {
                var outputArray = [];

                for (var prop in obj)
                {
                    outputArray.push(prop + '=' + obj[prop]);
                }

                return outputArray;
            };

            var pipeStringToObject = function (pipeString) {
                var obj = {};

                var kvPairs = pipeString.split('|');

                for (var i = 0, n = kvPairs.length; i < n; i++)
                {
                    var pair = kvPairs[i].split('=');
                    obj[pair[0]] = pair[1]; //sets the key value pair on our return object
                }

                return obj;
            };

            var objectToPipeString = function (obj, delimiter) {
                var properties = [];

                for (var prop in obj)
                {
                    properties.push(prop + '=' + obj[prop]);
                }

                return properties.join(delimiter || '|');
            };

            var getRandomColor = function () {
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';

                for (var i = 0; i < 6; i++)
                {
                    color += letters[Math.round(Math.random() * 15)];
                }

                return color;
            }

            // Public API
            return {
                arrayToObject: arrayToObject,
                objectToArray: objectToArray,
                pipeStringToObject: pipeStringToObject,
                objectToPipeString: objectToPipeString,
                getRandomColor: getRandomColor
            }
        };
        //--------------------------------------- /utils



        //--------------------------------------- url
        var url = function (url) {
            var urlString = url || window.location.href;

            var getQueryParams = function () {
                var whatToReturn = {};

                if (urlString.indexOf('?') !== -1)
                {
                    var urlSplit = urlString.split('?');
                    var queryParams = urlSplit[1].split('&');
                    var queryParamsObject = {}; //this is what we're storing and returning

                    /**
                     * final data will look like so:
                     * {
                     *     playerParams: {
                     *         id: "player",
                     *         width: 640,
                     *         ...
                     *     }
                     * }
                     */

                    if (urlSplit[1].indexOf('|') !== -1)
                    {
                        for (var i = 0, n = queryParams.length; i < n; i++)
                        {
                            var queryParam = queryParams[i];
                            var firstEqIndex = queryParam.indexOf('=');
                            if (firstEqIndex !== -1)
                            {
                                var collectionKey = queryParam.substr(0, firstEqIndex); //equates to playerParams in the example above
                                queryParamsObject[collectionKey] = {};
                                var keyValuePairsString = queryParam.substr(firstEqIndex+1);
                                var keyValuePairsArray = keyValuePairsString.split('|');

                                for (var i = 0, n = keyValuePairsArray.length; i < n; i++)
                                {
                                    var keyValuePair = keyValuePairsArray[i].split('=');
                                    var key = keyValuePair[0];
                                    var value = keyValuePair[1];

                                    queryParamsObject[collectionKey][key] = value;
                                }
                            }
                        }
                    }
                    else
                    {
                        queryParamsObject = utils().arrayToObject(queryParams);
                    }
                }
//                console.log('queryParamsObject', queryParamsObject);
                return queryParamsObject;
            };

            var getParamValue = function (key) {
                var queryParams = getQueryParams();

                if (_.isObject(queryParams)) //it should always be an object, but just in case
                {
                    for (var prop in queryParams)
                    {
                        if (prop === key)
                        {
                            return queryParams[prop];
                        }
                    }
                }

                return;
            };

            // Public API
            return  {
                getParamValue: getParamValue,
                getQueryParams: getQueryParams
            };
        };
        //--------------------------------------- /url


        //-------------------------------------------------------------------------------- /public methods



        //-------------------------------------------------------------------------------- private methods
        var displayModal = function (options) {
            if (_.isObject(options))
            {
                var modalOptions = {
                    message: '',
                    clearAfter: 0, //time in seconds: 0 means it will stay on screen indefinitely
                    resetPlayer: false
                };

                for (var prop in options)
                {
                    if (modalOptions.hasOwnProperty(prop))
                    {
                        modalOptions[prop] = options[prop];
                    }
                }

                try
                {
                    if (FDM_Player_vars.isFlash && _.isObject($pdk))
                    {
                        if (modalOptions.resetPlayer)
                        {
                            $pdk.controller.resetPlayer();
                        }

                        $pdk.controller.setPlayerMessage(modalOptions.message, modalOptions.clearAfter);
                    }
                    else if (FDM_Player_vars.isIOS)
                    {
                        //handle this in HTML5 with a card
                    }
                }
                catch (exception)
                {
                    // TODO: handle this, or get to a point where i don't have to use a try/catch
                }
            }
            else
            {
                // TODO: log this somewhere
            }
        };
        //-------------------------------------------------------------------------------- /private methods

        //-------------------------------------------------------------------------------- Public API
        return {
            player: player,
            url: url,
            utils: utils
        };
        //-------------------------------------------------------------------------------- /Public API
    };



    //-------------------------------------------------------------------------------- global definitions and AMD setup
    window.FoxNEO = window.$FoxNEO = FoxNEO = new FoxNEO();

    if (typeof define === "function" && define.amd && define.amd.FoxNEO)
    {
        define("FoxNEO", [], function () {
            return FoxNEO;
        });
    }
    //-------------------------------------------------------------------------------- /global definitions and AMD setup

})(window);
//-------------------------------------------------------------------------------------------------------------- /FoxNEO