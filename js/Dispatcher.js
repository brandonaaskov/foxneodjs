/*global define, _ */

define(['underscoreloader'], function (_) {
    'use strict';

    return function () {
        var _listeners = [];

        var addListener = function (eventName, callback) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                return false;
            }

            if (!_.isFunction(callback))
            {
                throw new Error("You can't create an event listener without supplying a callback function");
            }

            _listeners.push({
                name: eventName,
                callback: callback
            });

            return true;
        };

        var dispatch = function (eventName, data, dispatchOverWindow) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                throw new Error("You can't dispatch an event without supplying an event name (as a string)");
            }

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

            return true;
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

        var hasListener = function (eventName) {
            var found = false;

            if (!_.isEmpty(eventName) && _.isString(eventName))
            {
                _.each(_listeners, function (listener) {
                    if (listener.name === eventName)
                    {
                        found = true;
                    }
                });
            }

            return found;
        };

        var removeListener = function (eventName) {
            var updated = [],
                removed = false;

            _.each(_listeners, function (listener) {
                if (listener.name !== eventName)
                {
                    updated.push(listener);
                }
                else
                {
                    removed = true;
                }
            });

            _listeners = updated;

            return removed;
        };

        var removeAllListeners = function () {
            _listeners = [];

            return _listeners;
        };

        return {
            addEventListener: addListener,
            dispatch: dispatch,
            getEventListeners: getEventListeners,
            hasEventListener: hasListener,
            removeEventListener: removeListener,
            removeAllEventListeners: removeAllListeners
        };
    };
});