/*global define, _ */

define(['underscore', 'debug', 'Dispatcher'], function (underscore, Debug, Dispatcher) {

    'use strict';

    var debug = new Debug('polyfills'),
        dispatcher = new Dispatcher();

    var fixBrokenFeatures = function ()
    {
        if (_.isArray(arguments[0])) //we expect an array of string options here
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
                            debug.log("watch added");
                            dispatcher.dispatch('watchReady');
                            break;
                    }
                }
            }
        }
    };

    //---------------------------------------------- custom polyfills
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
                            newval = handler.call(this, prop, oldval, val);
                            return newval;
                        };

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
    }
    //---------------------------------------------- /custom polyfills

    (function init () {
        fixBrokenFeatures(['watch']);
    })();

    // Public API
    return {
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});