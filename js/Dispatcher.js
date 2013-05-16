/*global define, _ */

define([], function () {
    'use strict';

    return function () {
        var _listeners = [];

        var addListener = function (eventName, callback) {
            _listeners.push({
                name: eventName,
                callback: callback
            });
        };

        var removeListener = function (eventName, callback) {
            _listeners = _.without(_listeners, eventName);
        };

        var dispatch = function (eventName, data, dispatchOverWindow) {
            var event = document.createEvent('Event');
            var name = '@@packageName:' + eventName;
            event.initEvent(name, true, true);
            event.data = data || {};

            if (!dispatchOverWindow)
            {
//                _.invoke(list, 'callback');
                var listeners = _.where(listeners, {name: eventName});
                _.each(_listeners, function (listener) {
                    listener.callback(event);
                });
            }
            else
            {
                window.dispatchEvent(event);
            }
        };

        return {
            addEventListener: addListener,
            removeEventListener: removeEventListener,
            dispatch: dispatch
        };
    };
});