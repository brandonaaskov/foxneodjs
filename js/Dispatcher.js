/*global define, _ */

define([
    'underscoreloader',
    'jqueryloader'
], function (_, jquery) {
    'use strict';

    return function () {
        var _listeners = [],
            _messages = [];

        var addListener = function (eventName, callback) {
            var deferred = new jquery.Deferred();

            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                return false;
            }

            if (!_.isFunction(callback))
            {
                throw new Error("You can't create an event listener without supplying a callback function");
            }

            if (hasListener(eventName, callback))
            {
                _listeners.push({
                    name: eventName,
                    callback: callback,
                    deferred: deferred
                });

                return true;
            }

            return deferred;
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
                    listener.deferred.resolve(event);
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

        var hasListener = function (eventName, callback) {
            var found = false,
                checkCallbackToo = false;

            if (!_.isEmpty(eventName) && _.isString(eventName))
            {
                if (!_.isUndefined(callback) && _.isFunction(callback))
                {
                    checkCallbackToo = true;
                }

                _.each(_listeners, function (listener) {
                    if (listener.name === eventName)
                    {
                        if (checkCallbackToo)
                        {
                            if (listener.callback.toString() === callback.toString())
                            {
                                found = true;
                            }
                        }
                        else
                        {
                            found = true;
                        }
                    }
                });
            }

            return found;
        };

        var removeListener = function (eventName, callback) {
            if (_.isUndefined(eventName) || !_.isString(eventName))
            {
                throw new Error("The first argument supplied to removeEventListener() should be a string for the event name");
            }

            if (_.isUndefined(callback) || !_.isFunction(callback))
            {
                throw new Error("The second argument supplied to removeEventListener() should be a function for the callback that was used");
            }

            var updated = [],
                removed = false;

            _.each(_listeners, function (listener) {
                if (listener.name !== eventName && _listeners.callback.toString() !== callback.toString())
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

        var up = function (message, payload) {
            window.parent.postMessage({
                name: '@@packageName:' + message,
                data: payload
            }, '*');
        };

        var delivered = function (messageName) {
            var deferred = new jquery.Deferred();

            _.each(_messages, function (message) {
                if ('@@packageName:' + messageName === message.eventName)
                {
                    deferred.resolve(message);
                }
            });

            return deferred;
        };

        (function init () {
            window.addEventListener('message', function (event) {
                _messages.push({
                    eventName: event.name,
                    payload: event.data
                });
            });
        })();

        return {
            addEventListener: addListener,
            on: addListener,
            dispatch: dispatch,
            getEventListeners: getEventListeners,
            hasEventListener: hasListener,
            removeEventListener: removeListener,
            removeAllEventListeners: removeAllListeners,
            up: up,
            delivered: delivered
        };
    };
});