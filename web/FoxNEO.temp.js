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

            //---------------------------------------------- underscore shims
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
            //---------------------------------------------- /underscore shims
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

        //--------------------------------------- core features
        var setPlayerMessage = function (options) {
            displayModal(options);
        };
        //--------------------------------------- /core features




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
                    console.log('players', players);
                }

                return players;
            };

            var getPlayerAttributes = function (element) {
                var allAttributes = element.attributes;
                var playerAttributes = {};

                var addPlayerAttribute = function (key, value) {
                    playerAttributes[key] = value.toString();
                };

                for (var i = 0, n = allAttributes.length; i < n; i++)
                {
                    var attr = allAttributes[i],
                        attributePrefix = 'data-',
                        attrName = attr.nodeName;

                    if (attrName === 'id')
                    {
                        playerIds.push(attr.nodeValue);
                        addPlayerAttribute(attrName, attr.nodeValue);
                    }

                    if (attrName.indexOf('data-') !== -1)
                    {
                        var key = attrName.substr(attributePrefix.length);
                        var value;

                        switch (key)
                        {
                            case 'width':
                                key = attr.nodeValue || 640;
                                break;
                            case 'height':
                                key = attr.nodeValue || 360;
                                break;
                        }

                        addPlayerAttribute(key, attr.nodeValue);
                    }
                }

                return playerAttributes;
            };


            var injectIframe = function (attributes) {
                var elements = document.querySelectorAll('#' + attributes.id);

                if (elements.length === 1)
                {
                    var domElement = elements[0];
                    domElement.innerHTML = '<iframe ' +
                        'src="http://baaskov.local/tests/fox/btn/iframe-player.html?param=test" ' +
                        'scrolling="no" ' +
                        'frameborder="0" ' +
                        'width="' + attributes.width  +
                        'height="'+ attributes.height +'"></iframe>';
                }
                else if (elements.length > 1)
                {
                    throw new Error('The HTML ID you used for the player must be unique, ' +
                        'but there is more than one in this page.');
                }
                console.log('attributes', attributes);
            };

            var swapPlayers = function (selector) {
                var players = getPlayers(selector);

                for (var i = 0, n = players.length; i < n; i++)
                {
                    var player = players[i];
                    var attributes = getPlayerAttributes(player);
                    injectIframe(attributes);
                }
            };

            // Public API
            return {
                swapPlayers: swapPlayers
            };
        };
        //--------------------------------------- /iframe



        //--------------------------------------- url
        var url = function (url) {
            var urlString = url || window.location.href;

            var getQueryParams = function () {
                var queryParams = {};

                if (urlString.indexOf('?') !== -1)
                {
                    var urlSplit = urlString.split('?');
                    queryParams = urlSplit[1].split('&');
                }

                return queryParams;
            };

            var loop = function (queryParams, key, functionForMatch) {
                for (var i = 0, n = queryParams.length; i < n; i++)
                {
                    var keyValuePair = queryParams[i].split('=');

                    if (keyValuePair[0] === key)
                    {
                        var value = keyValuePair[1];
                        functionForMatch.call(key, value);
                    }
                }
            };

            var paramExists = function (key, value, callback) {
                var queryParams = getQueryParams();
                console.log('paramExists? ' + key, queryParams);

                loop(queryParams, key, function (foundKey, foundValue) {
                    console.log('paramExists:loop:foundKey', foundKey);
                    console.log('paramExists:loop:foundValue', foundValue);
                    console.log('paramExists:loop:value', value);
                    if (value) //value is optional, but we check for an exact match here too if it exists
                    {
                        return (foundValue === value) ? true : false;
                    }
                    console.log('paramExists:loop:returning true');
                    callback.call(true);
                });

                console.log('paramExists:loop:returning false', callback);
                callback().call(false);
            };

            var getParamValue = function (key) {
                console.log('getParamValue:key', key);
                paramExists(key, function (keyWasFound) {
                    console.log('getParamValue:keyWasFound', keyWasFound);
                    if (keyWasFound)
                    {
                        console.log('getParamValue:paramExists', key);
                        var queryParams = getQueryParams();
                        loop(queryParams, key, function (foundKey, foundValue) {
                            console.log('getParamValue:foundValue', foundValue);
                            return foundValue;
                        });
                    }
                    else
                    {
                        console.log('well shit');
                    }
                });
            };

            // Public API
            return  {
                paramExists : paramExists,
                getParamValue: getParamValue
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
            player: {
                setPlayerMessage: setPlayerMessage,
                iframe: iframe
            },
            utils: {
                url: url
            }
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