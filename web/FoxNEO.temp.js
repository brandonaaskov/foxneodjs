//---------------------------------------------------------------------------------------------------------- FoxNEO
/**
 * @project FoxNEO
 * @description Library for FDM video players
 * @author Brandon Aaskov
 * @version 0.1.0
 */
(function (window, undefined) {

    var FoxNEO = function () {
        //-------------------------------------------------------------------------------- public methods

        //--------------------------------------- player
        var player = function () {
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
        /**
         * This is an internal method that allows us to display a modal overlay on top of the player. setPlayerMessage()
         * uses this and we call that on the PDK controller if we need to, or use our own.
         * @param options
         */
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
                        console.log('HTML5');
                        //handle this in HTML5 with a card
                        if (modalOptions.resetPlayer)
                        {
                            console.log('resetting player');

                            var tpPlayers = document.querySelectorAll('.tpPlayer');

                            for (var i = 0, n = tpPlayers.length; i < n; i++)
                            {
                                var tpPlayer = tpPlayers[i];

                                console.log(tpPlayer);
                            }
                        }
                    }
                }
                catch (exception)
                {
                    throw new Error(exception);
                    // TODO: handle this, or get to a point where i don't have to use a try/catch
                }
            }
            else
            {
                // TODO: log this somewhere
            }
        };

        /**
         * This runs on init to handle polyfills that we need. Most of these are just ripped from underscore's
         * annotated source (thanks!). This allows us to grab some features that we need and keep the library pretty
         * small, though in the future I'd rather use the build process to include dependencies like this.
         */
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



            //---------------------------------------------- custom polyfills
            if (_.isArray(arguments[0]))
            {
                var polyfillList = arguments[0];
                for (var i = 0, n = polyfillList.length; i < n; i++)
                {
                    if (typeof polyfillList[i] === 'string')
                    {
                        switch (polyfillList[i].toLowerCase())
                        {
                            case 'watch':
                                watch();
                                console.log('watch polyfill added');
                                break;
                        }
                    }
                }
            }

            /**
             * This allows us to monitor property changes on objects and run callbacks when that happens.
             */
            function watch () {
                /*
                 * object.watch polyfill
                 *
                 * 2012-04-03
                 *
                 * By Eli Grey, http://eligrey.com
                 * Public Domain.
                 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
                 */

                // object.watch
                if (!Object.prototype.watch) {
                    Object.defineProperty(Object.prototype, "watch", {
                        enumerable: false
                        , configurable: true
                        , writable: false
                        , value: function (prop, handler) {
                            var
                                oldval = this[prop]
                                , newval = oldval
                                , getter = function () {
                                    return newval;
                                }
                                , setter = function (val) {
                                    oldval = newval;
                                    return newval = handler.call(this, prop, oldval, val);
                                }
                                ;

                            if (delete this[prop]) { // can't watch constants
                                Object.defineProperty(this, prop, {
                                    get: getter
                                    , set: setter
                                    , enumerable: true
                                    , configurable: true
                                });
                            }
                        }
                    });
                }

                // object.unwatch
                if (!Object.prototype.unwatch) {
                    Object.defineProperty(Object.prototype, "unwatch", {
                        enumerable: false
                        , configurable: true
                        , writable: false
                        , value: function (prop) {
                            var val = this[prop];
                            delete this[prop]; // remove accessors
                            this[prop] = val;
                        }
                    });
                }
            };
            //---------------------------------------------- /custom polyfills

        };
        //-------------------------------------------------------------------------------- /private methods





        //-------------------------------------------------------------------------------- initialization
        (function init () {
            fixBrokenFeatures(['watch']);

            player.watch('initialized', function (propertyName, oldValue, newValue) {
                console.log('ISDFSDFSDFSDFSDF', arguments);
            });
        })();
        //-------------------------------------------------------------------------------- /initialization





        //-------------------------------------------------------------------------------- Public API
        return {
            player: player,
            url: url,
            utils: utils
        };
        //-------------------------------------------------------------------------------- /Public API
    };



    //-------------------------------------------------------------------------------- global definitions and AMD setup
    window.FoxNEO = window.$f = FoxNEO = new FoxNEO();

    if (typeof define === "function" && define.amd && define.amd.FoxNEO)
    {
        define("FoxNEO", [], function () {
            return FoxNEO;
        });
    }
    //-------------------------------------------------------------------------------- /global definitions and AMD setup

})(window);
//-------------------------------------------------------------------------------------------------------------- /FoxNEO