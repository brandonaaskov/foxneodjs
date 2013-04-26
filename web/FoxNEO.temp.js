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

            //---------------------------------------------- polyfills
            // base64 (btoa and atob aren't supported pre IE10)
            (function(){var t="undefined"!=typeof window?window:exports,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n=function(){try{document.createElement("$")}catch(t){return t}}();t.btoa||(t.btoa=function(t){for(var o,e,a=0,c=r,f="";t.charAt(0|a)||(c="=",a%1);f+=c.charAt(63&o>>8-8*(a%1))){if(e=t.charCodeAt(a+=.75),e>255)throw n;o=o<<8|e}return f}),t.atob||(t.atob=function(t){if(t=t.replace(/=+$/,""),1==t.length%4)throw n;for(var o,e,a=0,c=0,f="";e=t.charAt(c++);~e&&(o=a%4?64*o+e:e,a++%4)?f+=String.fromCharCode(255&o>>(6&-2*a)):0)e=r.indexOf(e);return f})})();
            //---------------------------------------------- /polyfills

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

            _.isArray = nativeIsArray || function (obj) {
                return toString.call(obj) == '[object Array]';
            };

            _.isObject = function (obj) {
                return obj === Object(obj);
            };

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
                        console.log('attributesString', attributesString);
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

            var objectToPipeString = function (obj) {
                var properties = [];

                for (var prop in obj)
                {
                    properties.push(prop + '=' + obj[prop]);
                }

                return properties.join('|');
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
                objectToPipeString: objectToPipeString,
                getRandomColor: getRandomColor
            }
        };
        //--------------------------------------- /utils



        //--------------------------------------- url
        var url = function (url) {
            var urlString = url || window.location.href;

            var getQueryParams = function (returnArray) {
                var whatToReturn = {};

                if (urlString.indexOf('?') !== -1)
                {
                    var urlSplit = urlString.split('?');
                    var query{ara,}
                    if (urlSplit[1].indexOf('|') !== -1)
                    {
                        queryParams = urlSplit[1]
                    }
                    else
                    {
                        queryParams = urlSplit[1].split('&');
                    }
                }

                if (returnArray)
                {
                    queryParams = objectToArray(queryParams);
                }

                return whatToReturn;
            };

            var paramExists = function (key, value) {
                var queryParams = getQueryParams();

                for (var i = 0, n = queryParams.length; i < n; i++)
                {
                    var keyValuePair = queryParams[i].split('=');

                    if (keyValuePair[0] === key)
                    {
                        if (!value) //value is optional, but we check for an exact match here too if it exists
                        {
                            //we've matched on the key and no value was supplied to check for
                            return true;
                        }
                        else
                        {
                            return (keyValuePair[1] === value) ? true : false;
                        }
                    }
                }

                return;
            };

            var getParamValue = function (key) {
                if (paramExists(key))
                {
                    var queryParams = getQueryParams();

                    for (var i = 0, n = queryParams.length; i < n; i++)
                    {
                        var queryParam = queryParams[i],
                            keyValuePair = [];

                        if (queryParam.indexOf('|') !== -1) //we found a pipe string, so we handle it differently
                        {
                            var pipeStringPieces = queryParam.split('|');
                            console.log('queryParam', queryParam);
                            console.log('pipestringpieces', pipeStringPieces);

                            for (var j = 0, m = pipeStringPieces.length; j < m; j++)
                            {
                                var pipeStringPiece = pipeStringPieces[j];
                                console.log('---------', pipeStringPiece);
                                keyValuePair = pipeStringPiece.split('=');

                                if (keyValuePair[0] === key)
                                {
                                    console.log('!!!!!!!!', keyValuePair);
                                    return keyValuePair[1];
                                }
                            }
                        }
                        else
                        {
                            keyValuePair = queryParams[i].split('=');
                        }


                        console.log('!!!!!!!!', keyValuePair);

                        if (keyValuePair[0] === key)
                        {
                           return keyValuePair[1];
                        }
                    }
                }

                return;
            };

            // Public API
            return  {
                paramExists : paramExists,
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

        //only supports shallow objects right now
        var objectToArray = function (obj) {
            var outputArray = [];

            for (var prop in obj)
            {
                outputArray.push(prop + '=' + obj[prop]);
            }

            return outputArray;
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