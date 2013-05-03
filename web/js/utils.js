/*global define, _ */

define(['debug'], function (debug) {
    'use strict';

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

    var lowerCasePropertyNames = function (obj) { //only does a shallow lookup
        var output = {};

        for (var prop in obj)
        {
            output[prop.toLowerCase()] = obj[prop];
        }

        return output;
    };

    var getRandomColor = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';

        for (var i = 0; i < 6; i++)
        {
            color += letters[Math.round(Math.random() * 15)];
        }

        return color;
    };

    var getColorFromString = function (color) {
        if (!_.isUndefined(color))
        {
            var correctLength = (color.length === 6 || color.length === 7);

            /**
             * We want to make sure that the color supplied is the right length (6 characters without a hash
             * and 7 with). Then, if no hash exists, we add it ourselves.
             */
            if ((_.isString(color) || _.isNumber(color)) && correctLength)
            {
                if (correctLength === 6 && color.indexOf('#') === -1)
                {
                    color = '#' + color;
                }

                return color;
            }
//            else
//            {
//                debug.log({
//                    type: 'utils',
//                    message: 'Whatever you supplied to getColorFromString() was either not a string, not a number and/or ' +
//                        'not the right length (should be 6 characters with no hash and 7 with).',
//                    warn: true
//                });
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

    var dispatchEvent = function (eventName, data) {
        var event = document.createEvent('Event');
        event.initEvent(eventName, true, true);
        event.customData = data || {};
        window.dispatchEvent(event);
    };

    // Public API
    return {
        arrayToObject: arrayToObject,
        objectToArray: objectToArray,
        pipeStringToObject: pipeStringToObject,
        objectToPipeString: objectToPipeString,
        lowerCasePropertyNames: lowerCasePropertyNames,
        getRandomColor: getRandomColor,
        getColorFromString: getColorFromString,
        addPixelSuffix: addPixelSuffix,
        removePixelSuffix: removePixelSuffix,
        dispatchEvent: dispatchEvent,
        dispatch: dispatchEvent //alias
    };
});