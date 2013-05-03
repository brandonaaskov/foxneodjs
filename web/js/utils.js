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

    var getRandomColor = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';

        for (var i = 0; i < 6; i++)
        {
            color += letters[Math.round(Math.random() * 15)];
        }

        return color;
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
        getRandomColor: getRandomColor,
        dispatchEvent: dispatchEvent,
        dispatch: dispatchEvent //alias
    };
});