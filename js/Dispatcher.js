/*global define, _ */

define(['underscoreloader'], function (_) {
    'use strict';

    return function () {
        var _listeners = [];

        var addListener = function (eventName, callback) {
            _listeners.push({
                name: eventName,
                callback: callback
            });
        };

        var removeListener = function (eventName) {
            window.console.log('removeListener for ' + eventName);
            window.console.log('before: _listeners', _listeners);

            var updated = [];

            _.each(_listeners, function (listener) {
                if (listener.name !== eventName)
                {
                    updated.push(listener);
                }
            });

            _listeners = updated;
            window.console.log('after: _listeners', _listeners);
        };

        var dispatch = function (eventName, data, dispatchOverWindow) {
            var event = document.createEvent('Event');
            var name = '@@packageName:' + eventName;
            event.initEvent(name, true, true);
            event.data = data || {};

            if (!dispatchOverWindow)
            {
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

        var getEventListeners = function (eventName) {

            if (_.isUndefined(eventName))
            {
                return _listeners;
            }

            var found = [];

            _.each(_listeners, function (listener) {
                if (listener.name === eventName)
                {
                    found.push(listener);
                }
            });

            return found;
        };

        return {
            addEventListener: addListener,
            dispatch: dispatch,
            getEventListeners: getEventListeners,
            removeEventListener: removeListener
        };
    };
});