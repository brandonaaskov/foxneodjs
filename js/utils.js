/*global define, _ */

define(['Dispatcher', 'underscoreloader'], function (Dispatcher, _) {
    'use strict';

    var dispatcher = new Dispatcher();

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
            else
            {
                obj[i] = item;
            }
        }

        return obj;
    };

    //only supports shallow objects right now
    var objectToArray = function (obj) {
        var outputArray = [];

        _.each(obj, function (value, key) {
            if (!_.isObject(value))
            {
                outputArray.push(key +'='+ value);
            }
            else
            {
                throw new Error("The value you supplied to objectToArray() was not a basic (numbers and strings) " +
                    "shallow object");
            }
        });

        return outputArray;
    };

    var booleanToString = function (flag) {
        if (_.isUndefined(flag))
        {
//            debug.warn("Whatever you passed to booleanToString() was undefined, so we returned false to play it safe.");
            return 'false';
        }
        else if (!_.isBoolean(flag)) //if we don't get a boolean, just return false
        {
            if (_.isString(flag))
            {
//                debug.warn("You passed a string ("+ flag +") to the booleanToString() method. Don't do that.");
                flag = booleanToString(flag);
            }

            return 'false';
        }

        var boolString = String(flag).toLowerCase();

        return boolString || 'false';
    };

    var stringToBoolean = function (flag) {
        return (flag === 'true') ? true : false;
    };

    var isDefined = function (obj, checkEmpty) {

        if (_.isUndefined(obj))
        {
            return false;
        }

        if (_.isNull(obj))
        {
            return false;
        }

        if (checkEmpty)
        {
            if (_.isEmpty(obj))
            {
                return false;
            }
        }

        return true;
    };

    var isLooseEqual = function (itemA, itemB) {
        if (_.isUndefined(itemA) || _.isUndefined(itemB))
        {
            return false;
        }

        var normalizedA = !_.isFinite(itemA) ? String(itemA).toLowerCase() : +itemA,
            normalizedB = !_.isFinite(itemB) ? String(itemB).toLowerCase() : +itemB;

        //despite how odd it is that i use strict equal in a function called isLooseEqual, it's because of JSHint
        // and I've already cast the objects to strings anyway
        if (normalizedA === normalizedB)
        {
            return true;
        }

        return false;
    };

    var isShallowObject = function (obj) {
        if (_.isUndefined(obj))
        {
            return false;
        }

        if (!_.isTrueObject(obj))
        {
            return false;
        }

        if (_.isTrueObject(obj) && _.isEmpty(obj))
        {
            return false;
        }

        var shallow = true;

        _.each(obj, function (index, item) {
            var value = obj[item];

            if (_.isTrueObject(value))
            {
                shallow = false;
            }
        });

        return shallow;
    };

    var isTrueObject = function (obj) {
        if (_.isUndefined(obj))
        {
            return false;
        }

        if (_.isObject(obj) && !_.isFunction(obj) && !_.isArray(obj))
        {
            return true;
        }

        return false;
    };

    var isURL = function (url) {
        if (_.isUndefined(url) || _.isEmpty(url))
        {
            return false;
        }

        if (!_.isString(url))
        {
            return false;
        }

        var urlRegex = /^(https?:\/\/)?(www)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?[^?]+(?:\?([^&]+).*)?$/;

        return urlRegex.test(url);
    };

    /**
     * Loops through the provided object (shallow) and when value matches, the key is returned.
     * @param obj
     * @param value
     * @returns {String}
     */
    var getKeyFromValue = function (obj, value) {
        for (var prop in obj)
        {
            if (_.has(obj, prop))
            {
                //we want this to be flexible, so we check the string versions (want to keep strict equal)
                // (see /tests/qunit/tests.js)
                if (String(obj[prop]) === String(value))
                {
                    return prop;
                }
            }
        }

        return '';
    };

    var pipeStringToObject = function (pipeString) {
        var obj = {};

        var kvPairs = pipeString.split('|');

        for (var i = 0, n = kvPairs.length; i < n; i++)
        {
            var pair = kvPairs[i].split(/=(.+)?/, 2); //makes sure we only split on the first = found
            var value = pair[1] || null; //i prefer null in this case
            obj[pair[0]] = value; //sets the key value pair on our return object
        }

        return obj;
    };

    var objectToPipeString = function (obj, delimiter) {
        var properties = [];

        if (isShallowObject(obj))
        {
            _.each(obj, function (value, key) {
                properties.push(key + '=' + value);
            });
        }
        else
        {
            throw new Error("The first argument you supplied to objectToPipeString() was not a " +
                "valid object. The objectToPipeString() method only supports a shallow object of strings and numbers.");
        }

        return properties.join(delimiter || '|');
    };

    var lowerCasePropertyNames = function (obj) { //only does a shallow lookup
        var output = {};

//        for (var prop in obj)
//        {
//            output[prop.toLowerCase()] = obj[prop];
//        }
//
        _.each(obj, function (value, key) {

            //it's just a true object (i.e. {})
            if (_.isObject(value) && !_.isFunction(value) && !_.isArray(value))
            {
//                throw new Error("lowerCasePropertyNames() only supports a shallow object.");
                value = lowerCasePropertyNames(value);
            }

            output[key.toLowerCase()] = value;
        });

        return output;
    };

//    var getRandomColor = function () {
//        var letters = '0123456789ABCDEF'.split('');
//        var color = '#';
//
//        for (var i = 0; i < 6; i++)
//        {
//            color += letters[Math.round(Math.random() * 15)];
//        }
//
//        return color;
//    };

    var getColorFromString = function (color) {
        if (!_.isUndefined(color))
        {
            if (!_.isString(color))
            {
                throw new Error('The value supplied to getColorFromString() should be a string, not whatever you passed in.');
            }

            /**
             * We want to make sure that the color supplied is the right length (6 characters without a hash
             * and 7 with). Then, if no hash exists, we add it ourselves.
             */
            var correctLength = (color.length === 6 || color.length === 7);
            if (correctLength)
            {
                if (color.length === 6 && color.indexOf('#') === -1)
                {
                    color = '#' + color;
                }

                return color.toLowerCase();
            }
//            else
//            {
//                debug.warn('Whatever you supplied to getColorFromString() was either not a string, not a number ' +
//                    'and/or not the right length (should be 6 characters with no hash and 7 with).');
//            }
        }

        return null;
    };

    var addPixelSuffix = function (text) {
        var size = String(text);
        var index = String(size).indexOf('px');

        if (index === -1)
        {
            size = size + 'px';
        }
//        else if (index < (text.length-1))
//        {
              //hmmmm - should I strip the px out of the string if it's mid string, add the px and return that but warn anyway?
//            debug.log({
//                type: 'utils',
//                message: "Whatever you supplied to addPixelSuffix() already had px in it, but it wasn't at the end of " +
//                    "the string, which is probably a bad thing.",
//                warn: true
//            });
//        }

        return size;
    };

    var removePixelSuffix = function (text) {
        text = String(text);
        var index = text.indexOf('px');

        if (index !== -1)
        {
            if (index === (text.length-2))
            {
                return text.substr(0, index);
            }
//            else
//            {
//                debug.log({
//                    type: 'utils',
//                    message: "Whatever you supplied to removePixelSuffix() already had px in it, but it wasn't at the " +
//                        "end of the string, which is probably a bad thing.",
//                    warn: true
//                });
//            }
        }

        return text;
    };

    var addToHead = function (tagName, attributes) {
        if (_.isEmpty(tagName) || !_.isString(tagName))
        {
            throw new Error("You have to provide a tag name when calling addToHead()");
        }

        if (_.isEmpty(attributes) || !_.isTrueObject(attributes))
        {
            throw new Error("You have to provide at least one attribute and it needs to be passed as an object");
        }

        var elem = document.createElement(tagName);

        _.each(attributes, function (value, key) {
            key = key.toLowerCase().replace(/\W/g, '');

            if (/^[a-z0-9-]+$/.test(key))
            {
                elem.setAttribute(key, value);
            }
        });

        document.getElementsByTagName('head')[0].appendChild(elem);

        return true;
    };



    //---------------------------------------------- url stuff
    var urlString = window.location.href;

    var getQueryParams = function (url) {
        var queryParamsObject = {}; //this is what we're storing and returning
        url = url || urlString;

        if (url.indexOf('?') !== -1)
        {
            var urlSplit = url.split('?');
            var queryParams = urlSplit[1].split('&');

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
                        var keyValuePairsString = queryParam;
                        var collectionKey = queryParam.substr(0, firstEqIndex); //equates to playerParams in the example above
                        queryParamsObject[collectionKey] = {};
                        var keyValuePairsArray = keyValuePairsString.split('|');

                        for (var j = 0, kvpLength = keyValuePairsArray.length; j < kvpLength; j++)
                        {
                            var keyValuePair = keyValuePairsArray[j].split('=');
                            var key = keyValuePair[0];
                            var value = keyValuePair[1];

                            if (urlSplit[1].indexOf('&') !== -1)
                            {
                                keyValuePairsString = queryParam.substr(firstEqIndex+1);
                                //if we have an ampersand, it's not just a basic pipe string, so we need to make a
                                // more complex object
                                queryParamsObject[collectionKey][key] = value;
                            }
                            else
                            {
                                //just a pipe string, no other key-value pairs so we can make a basic object
                                queryParamsObject[key] = value;
                            }
                        }
                    }
                }
            }
            else
            {
                queryParamsObject = arrayToObject(queryParams);
            }
        }

        return queryParamsObject;
    };

    var removeQueryParams = function (url) {
        var cleanedURL = '';

        if (_.isDefined(url) && _.isURL(url))
        {
            cleanedURL = url;

            if (url.indexOf('?') !== -1)
            {
                cleanedURL = url.split('?')[0];
            }
            else
            {
                cleanedURL = url;
            }
        }

//        if (_.isEmpty(cleanedURL))
//        {
//            debug.warn("For whatever reason, the URL supplied to removeQueryParams() ended up returning an empty string.");
//        }

        return cleanedURL;
    };

    var getParamValue = function (key, url) {
        var queryParams = getQueryParams(url);

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

    //second and third params optional
    var paramExists = function (key, value, url) {
        var queryParams = getQueryParams(url);

        for (var prop in queryParams)
        {
            if (queryParams.hasOwnProperty(prop))
            {
                if (prop === key)
                {
                    if (value)
                    {
                        if (queryParams[prop] === value)
                        {
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    }

                    return true;
                }
            }
        }

        return false;
    };

    /**
     * This is mostly for testing purposes so we can spoof URLs easily, but it's public since I'm big on the "eat your
     * own dog food" thing.
     * @param url
     */
    var setURL = function (url) {
        urlString = url;

        return urlString;
    };

    var getURL = function () {
        return urlString;
    };
    //---------------------------------------------- /url stuff


    //adds our helper methods to Underscore
    (function () {
        _.mixin({
            arrayToObject: arrayToObject,
            objectToArray: objectToArray,
            getKeyFromValue: getKeyFromValue,
            pipeStringToObject: pipeStringToObject,
            objectToPipeString: objectToPipeString,
            lowerCasePropertyNames: lowerCasePropertyNames,
            getColorFromString: getColorFromString,
            addPixelSuffix: addPixelSuffix,
            removePixelSuffix: removePixelSuffix,
            stringToBoolean: stringToBoolean,
            booleanToString: booleanToString,
            getParamValue: getParamValue,
            getQueryParams: getQueryParams,
            removeQueryParams: removeQueryParams,
            paramExists: paramExists,
            isDefined: isDefined,
            isLooseEqual: isLooseEqual,
            isShallowObject: isShallowObject,
            isTrueObject: isTrueObject,
            isURL: isURL
        });
    })();

    // Public API
    return {
        arrayToObject: arrayToObject,
        objectToArray: objectToArray,
        getKeyFromValue: getKeyFromValue,
        pipeStringToObject: pipeStringToObject,
        objectToPipeString: objectToPipeString,
        lowerCasePropertyNames: lowerCasePropertyNames,
        getColorFromString: getColorFromString,
        addPixelSuffix: addPixelSuffix,
        removePixelSuffix: removePixelSuffix,
        stringToBoolean: stringToBoolean,
        booleanToString: booleanToString,
        addToHead: addToHead,
        getParamValue: getParamValue,
        getQueryParams: getQueryParams,
        removeQueryParams: removeQueryParams,
        paramExists: paramExists,
        isDefined: isDefined,
        isLooseEqual: isLooseEqual,
        isShallowObject: isShallowObject,
        isTrueObject: isTrueObject,
        isURL: isURL,

        setURL: setURL,
        getURL: getURL,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});